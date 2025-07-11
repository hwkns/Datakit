import { useState, useCallback } from 'react';
import { useAIStore } from '@/store/aiStore';
import { useDuckDBStore } from '@/store/duckDBStore';
import { useChartsStore } from '@/store/chartsStore';
import { useNotifications } from '@/hooks/useNotifications';
import { createChartRecommendationPrompt } from '@/lib/ai/prompts/chartPrompts';
import { aiService } from '@/lib/ai/aiService';
import { sanitizeSQL, fixCommonSQLIssues, fixUnionQueries } from '@/lib/duckdb/sqlSanitizer';

interface VisualizationRequest {
  sql: string;
  responseId: string;
  queryIndex: number;
}

interface ChartRecommendation {
  chartType: 'line' | 'bar' | 'scatter' | 'pie' | 'area' | 'heatmap';
  confidence: number;
  reasoning: string;
  config: {
    xAxis: string;
    yAxis: string | string[];
    groupBy?: string;
    aggregation?: string;
    colorScheme?: 'cyan' | 'purple' | 'gradient';
    enableArea?: boolean;
    enablePoints?: boolean;
    layout?: 'horizontal' | 'vertical';
  };
  dataTransform?: {
    needsAggregation: boolean;
    suggestedSQL: string;
  };
}

export const useAIVisualization = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeVisualizations, setActiveVisualizations] = useState<Map<string, any>>(new Map());
  
  const { showError, showSuccess } = useNotifications() || {};
  const { context, activeProvider, apiKeys, setVisualizationTokenUsage } = useAIStore();
  const { executeQuery } = useDuckDBStore();
  const { createChart } = useChartsStore();

  const generateVisualization = useCallback(async (request: VisualizationRequest) => {
    const vizId = `${request.responseId}-${request.queryIndex}`;
    
    try {
      setIsGenerating(true);

      // Step 1: Execute the SQL query
      const queryResult = await executeQuery(request.sql);
      
      if (!queryResult) {
        showError?.('No data returned from query');
        return { success: false };
      }

      // Convert DuckDB result to array format
      const rows = queryResult.toArray();
      const columns = queryResult.schema.fields.map(field => field.name);
      
      if (!rows || rows.length === 0) {
        showError?.('No data returned from query');
        return { success: false };
      }

      // Step 2: Get chart recommendation from AI
      const recommendationPrompt = createChartRecommendationPrompt(
        request.sql,
        context!,
        {
          columns: columns,
          rowCount: rows.length,
          sampleData: rows.slice(0, 5)
        }
      );

      const aiResponse = await aiService.generateCompletion(
        activeProvider,
        [{ role: 'user', content: recommendationPrompt }],
        { temperature: 0.1, maxTokens: 1000 }
      );

      // Track token usage for visualization
      if (aiResponse.usage) {
        setVisualizationTokenUsage({
          input: aiResponse.usage.promptTokens || 0,
          output: aiResponse.usage.completionTokens || 0
        });
      }

      let recommendation: ChartRecommendation;
      try {
        // Parse AI response to get chart recommendation
        const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          recommendation = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid AI response format');
        }
      } catch (error) {
        // Fallback to basic heuristics
        recommendation = getBasicChartRecommendation({ columns, rows });
      }

      // Step 3: Transform data if needed
      let finalData = rows;
      if (recommendation.dataTransform?.needsAggregation) {
        // Fix common SQL issues in the suggested transformation
        let transformSQL = recommendation.dataTransform.suggestedSQL;
        
        // Extract table name from original SQL
        const tableMatch = request.sql.match(/FROM\s+["']?([^"'\s;]+)["']?/i);
        const tableName = tableMatch ? tableMatch[1] : context?.tableName || '';
        
        // Apply fixes
        transformSQL = fixCommonSQLIssues(transformSQL);
        transformSQL = fixUnionQueries(transformSQL, tableName);
        transformSQL = sanitizeSQL(transformSQL, columns);
        
        // console.log('Executing transform SQL:', transformSQL);
        
        const transformResult = await executeQuery(transformSQL);
        if (transformResult) {
          finalData = transformResult.toArray();
        }
      }

      // Step 4: Store visualization data
      const vizData = {
        id: vizId,
        sql: request.sql,
        data: finalData,
        config: recommendation.config,
        chartType: recommendation.chartType,
        reasoning: recommendation.reasoning,
        timestamp: Date.now()
      };

      setActiveVisualizations(prev => {
        const newMap = new Map(prev);
        newMap.set(vizId, vizData);
        return newMap;
      });

      showSuccess?.('Visualization generated successfully');
      return { success: true, data: vizData };

    } catch (error) {
      console.error('Error generating visualization:', error);
      showError?.('Failed to generate visualization');
      return { success: false };
    } finally {
      setIsGenerating(false);
    }
  }, [context, activeProvider, apiKeys, executeQuery, showError, showSuccess]);

  const getBasicChartRecommendation = (queryResult: { columns: string[]; rows: any[] }): ChartRecommendation => {
    const { columns, rows } = queryResult;
    const numericColumns = columns.filter((col: string) => {
      const firstValue = rows[0]?.[col];
      return typeof firstValue === 'number';
    });

    const nonNumericColumns = columns.filter((col: string) => !numericColumns.includes(col));

    // Check if this is a summary/metrics query (single row with multiple aggregates)
    if (rows.length === 1 && numericColumns.length > 1) {
      // For summary data, don't transform - just visualize directly
      return {
        chartType: 'bar',
        confidence: 0.9,
        reasoning: 'Summary metrics data - bar chart recommended',
        config: {
          xAxis: 'metric',
          yAxis: 'value',
          colorScheme: 'gradient',
          layout: 'horizontal'
        }
      };
    }

    // Basic heuristics
    if (numericColumns.length >= 2 && nonNumericColumns.length === 0) {
      // Scatter plot for two numeric columns
      return {
        chartType: 'scatter',
        confidence: 0.7,
        reasoning: 'Two numeric columns detected - scatter plot recommended',
        config: {
          xAxis: numericColumns[0],
          yAxis: numericColumns[1],
          colorScheme: 'cyan'
        }
      };
    } else if (nonNumericColumns.length === 1 && numericColumns.length === 1) {
      // Bar chart for category + value
      return {
        chartType: 'bar',
        confidence: 0.8,
        reasoning: 'Categorical and numeric columns - bar chart recommended',
        config: {
          xAxis: nonNumericColumns[0],
          yAxis: numericColumns[0],
          colorScheme: 'purple',
          layout: rows.length > 10 ? 'horizontal' : 'vertical'
        }
      };
    } else if (columns.some((col: string) => col.toLowerCase().includes('date') || col.toLowerCase().includes('time'))) {
      // Line chart for time series
      return {
        chartType: 'line',
        confidence: 0.85,
        reasoning: 'Time-based data detected - line chart recommended',
        config: {
          xAxis: columns.find((col: string) => col.toLowerCase().includes('date') || col.toLowerCase().includes('time')),
          yAxis: numericColumns[0] || columns[1],
          colorScheme: 'gradient',
          enableArea: true,
          enablePoints: rows.length < 50
        }
      };
    }

    // Default to bar chart
    return {
      chartType: 'bar',
      confidence: 0.6,
      reasoning: 'Default visualization',
      config: {
        xAxis: columns[0],
        yAxis: columns[1],
        colorScheme: 'cyan'
      }
    };
  };

  const getVisualization = useCallback((vizId: string) => {
    return activeVisualizations.get(vizId);
  }, [activeVisualizations]);

  const clearVisualization = useCallback((vizId: string) => {
    setActiveVisualizations(prev => {
      const newMap = new Map(prev);
      newMap.delete(vizId);
      return newMap;
    });
  }, []);

  const exportVisualization = useCallback(async (vizId: string, format: 'png' | 'svg' | 'csv') => {
    const viz = activeVisualizations.get(vizId);
    if (!viz) {
      showError?.('Visualization not found');
      return;
    }

    try {
      if (format === 'csv') {
        // Export data as CSV
        const csv = convertToCSV(viz.data);
        downloadFile(csv, `visualization-${vizId}.csv`, 'text/csv');
      } else {
        // For PNG/SVG, we'll need to implement chart export
        showSuccess?.(`Export to ${format.toUpperCase()} coming soon`);
      }
    } catch (error) {
      showError?.(`Failed to export as ${format}`);
    }
  }, [activeVisualizations, showError, showSuccess]);

  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => JSON.stringify(row[header] ?? '')).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    generateVisualization,
    getVisualization,
    clearVisualization,
    exportVisualization,
    isGenerating,
    activeVisualizations: Array.from(activeVisualizations.values())
  };
};
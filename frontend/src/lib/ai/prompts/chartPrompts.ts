import { AIContextData } from "../types";

export const createChartRecommendationPrompt = (
  sql: string,
  context: AIContextData,
  queryResults?: { columns: string[]; rowCount: number; sampleData?: any[] }
): string => {
  const columnsInfo = queryResults 
    ? `Result columns: ${queryResults.columns.join(', ')}`
    : `Available columns: ${context.schema.map(col => `${col.name} (${col.type})`).join(', ')}`;

  return `Analyze this SQL query and recommend the best visualization:

SQL Query:
\`\`\`sql
${sql}
\`\`\`

${columnsInfo}
${queryResults ? `Result row count: ${queryResults.rowCount}` : ''}

Please provide a JSON response with the following structure:
{
  "chartType": "line" | "bar" | "scatter" | "pie" | "area" | "heatmap",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation",
  "config": {
    "xAxis": "column_name",
    "yAxis": "column_name" | ["column1", "column2"],
    "groupBy": "optional_column",
    "aggregation": "sum" | "avg" | "count" | "min" | "max",
    "colorScheme": "cyan" | "purple" | "gradient",
    "enableArea": boolean (for line charts),
    "enablePoints": boolean (for line charts),
    "layout": "horizontal" | "vertical" (for bar charts)
  },
  "dataTransform": {
    "needsAggregation": boolean,
    "suggestedSQL": "optimized SQL if needed - IMPORTANT: Always quote column names that contain special characters or numbers"
  }
}

Consider:
1. Time series data → Line/Area chart
2. Categorical comparisons → Bar chart  
3. Correlations → Scatter plot
4. Part-to-whole → Pie chart
5. Multi-dimensional → Heatmap

CRITICAL SQL RULES for dataTransform.suggestedSQL:
- Always quote column names containing special characters or numbers (e.g., "TRWIBEB1XXX", "BE61967040560817")
- In UNION queries, each SELECT must have its own FROM clause
- Example: SELECT 'Metric1' as name, COUNT(*) as value FROM table UNION ALL SELECT 'Metric2', COUNT(*) FROM table
- Never reference columns without a FROM clause in UNION queries`;
};

export const createVisualizationPrompt = (
  userPrompt: string,
  context: AIContextData
): string => {
  return `Create a visualization for: "${userPrompt}"

Table: ${context.tableName}
Schema: ${context.schema.map(col => `${col.name} (${col.type})`).join(', ')}

Generate TWO things:
1. SQL query optimized for visualization (with appropriate aggregations)
2. Chart configuration

Response format:
\`\`\`sql
-- Your SQL query here
\`\`\`

CHART_CONFIG:
{
  "type": "chart_type",
  "title": "Chart Title",
  "description": "What this shows",
  "config": { ... }
}

Tips:
- For time series, use date_trunc() for appropriate granularity
- Limit results to manageable visualization size (max 1000 points)
- Include ORDER BY for consistent results
- Consider using window functions for running totals/averages`;
};

export const createInsightPrompt = (
  chartData: any[],
  chartType: string,
  context: AIContextData
): string => {
  const dataPreview = chartData.slice(0, 10)
    .map(row => JSON.stringify(row))
    .join('\n');

  return `Analyze this visualization data and provide insights:

Chart Type: ${chartType}
Data Preview:
${dataPreview}
Total Points: ${chartData.length}

Provide:
1. Key insights (2-3 bullet points)
2. Anomalies or interesting patterns
3. Suggested follow-up analysis
4. Data quality observations

Keep insights concise and actionable.`;
};
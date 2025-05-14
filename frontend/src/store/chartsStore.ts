// src/store/chartsStore.ts
import { create } from 'zustand';

// Chart types supported by the system
export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'column' | 'donut';

// Interface for axis configuration
export interface AxisConfig {
  field: string;
  label: string;
  dataKey?: string;
}

// Interface for saved chart configuration
export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  description?: string;
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  colorBy?: string;
  showLegend: boolean;
  showGrid: boolean;
  stackedData?: boolean;
  palette: string; // Reference to a color palette
  timestamp: number;
  query?: string; // Original SQL query that produced the data
}

// Interface for the current chart being edited
export interface CurrentChart extends ChartConfig {
  data: any[];
  isModified: boolean;
}

// Interface for the charts store state
interface ChartsState {
  // Current chart being edited/viewed
  currentChart: CurrentChart | null;
  
  // Saved chart configurations
  savedCharts: ChartConfig[];
  
  // Available chart templates
  chartTemplates: ChartConfig[];
  
  // Available color palettes
  colorPalettes: Record<string, string[]>;
  
  // Actions
  setCurrentChart: (chart: CurrentChart | null) => void;
  updateCurrentChart: (updates: Partial<CurrentChart>) => void;
  saveCurrentChart: () => void;
  createNewChart: (type: ChartType, data: any[], query?: string) => void;
  deleteChart: (id: string) => void;
  loadChart: (id: string) => void;
}

// Default color palettes
const defaultPalettes = {
  primary: ['#00d2c3', '#13a19a', '#138c9a', '#137e9a', '#136e9a'],
  secondary: ['#a54fff', '#9845db', '#803ab6', '#682f92', '#50246d'],
  tertiary: ['#00dfa8', '#00c7a2', '#00ae9b', '#009595', '#007b8e'],
  contrast: ['#00d2c3', '#a54fff', '#00dfa8', '#ff4f80', '#ffe500'],
  grayscale: ['#2a2c39', '#444655', '#5f6171', '#7a7c8d', '#9597a8'],
};

/**
 * Zustand store for managing chart state
 */
export const useChartsStore = create<ChartsState>((set, get) => ({
  currentChart: null,
  savedCharts: [],
  chartTemplates: [],
  colorPalettes: defaultPalettes,
  
  setCurrentChart: (chart) => set({ currentChart: chart }),
  
  updateCurrentChart: (updates) => {
    const { currentChart } = get();
    if (!currentChart) return;
    
    set({
      currentChart: {
        ...currentChart,
        ...updates,
        isModified: true
      }
    });
  },
  
  saveCurrentChart: () => {
    const { currentChart, savedCharts } = get();
    if (!currentChart) return;
    
    // Prepare chart config for saving (omit data and isModified)
    const chartToSave: ChartConfig = {
      id: currentChart.id,
      title: currentChart.title,
      type: currentChart.type,
      description: currentChart.description,
      xAxis: currentChart.xAxis,
      yAxis: currentChart.yAxis,
      colorBy: currentChart.colorBy,
      showLegend: currentChart.showLegend,
      showGrid: currentChart.showGrid,
      stackedData: currentChart.stackedData,
      palette: currentChart.palette,
      timestamp: Date.now(),
      query: currentChart.query
    };
    
    // Update existing or add new
    const existingIndex = savedCharts.findIndex(c => c.id === chartToSave.id);
    if (existingIndex >= 0) {
      const updatedCharts = [...savedCharts];
      updatedCharts[existingIndex] = chartToSave;
      set({ 
        savedCharts: updatedCharts,
        currentChart: { ...currentChart, isModified: false }
      });
    } else {
      set({ 
        savedCharts: [...savedCharts, chartToSave],
        currentChart: { ...currentChart, isModified: false }
      });
    }
    
    // TODO: Persist to IndexedDB in a future enhancement
  },
  
  createNewChart: (type, data, query) => {
    const id = `chart-${Date.now()}`;
    
    // Automatically determine reasonable defaults for x and y axes
    const xAxisField = getDefaultXAxisField(data);
    const yAxisField = getDefaultYAxisField(data, xAxisField);
    
    const newChart: CurrentChart = {
      id,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      type,
      xAxis: {
        field: xAxisField,
        label: formatFieldLabel(xAxisField),
        dataKey: xAxisField
      },
      yAxis: {
        field: yAxisField,
        label: formatFieldLabel(yAxisField),
        dataKey: yAxisField
      },
      showLegend: true,
      showGrid: true,
      palette: 'primary',
      timestamp: Date.now(),
      query,
      data,
      isModified: true
    };
    
    set({ currentChart: newChart });
  },
  
  deleteChart: (id) => {
    const { savedCharts, currentChart } = get();
    
    // Remove from saved charts
    set({ savedCharts: savedCharts.filter(c => c.id !== id) });
    
    // If the current chart is being deleted, set to null
    if (currentChart && currentChart.id === id) {
      set({ currentChart: null });
    }
    
    // TODO: Remove from IndexedDB in a future enhancement
  },
  
  loadChart: (id) => {
    const { savedCharts } = get();
    const chartToLoad = savedCharts.find(c => c.id === id);
    
    if (chartToLoad) {
      // TODO: Load associated data from DuckDB or cache
      set({
        currentChart: {
          ...chartToLoad,
          data: [], // This would be populated with actual data
          isModified: false
        }
      });
    }
  }
}));

/**
 * Helper to format a field name as a readable label
 */
function formatFieldLabel(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\w/, c => c.toUpperCase());
}

/**
 * Helper to determine a reasonable default x-axis field
 * Prefers date fields, then categorical fields, then the first field
 */
function getDefaultXAxisField(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const sample = data[0];
  const fields = Object.keys(sample);
  
  // Look for date-like fields
  const dateField = fields.find(field => 
    field.toLowerCase().includes('date') || 
    field.toLowerCase().includes('time') ||
    field.toLowerCase().includes('day') ||
    field.toLowerCase().includes('month') ||
    field.toLowerCase().includes('year'));
  
  if (dateField) return dateField;
  
  // Look for common category fields
  const categoryField = fields.find(field => 
    field.toLowerCase().includes('category') ||
    field.toLowerCase().includes('type') ||
    field.toLowerCase().includes('group') ||
    field.toLowerCase().includes('name') ||
    field.toLowerCase().includes('id'));
  
  if (categoryField) return categoryField;
  
  // Default to first field
  return fields[0] || '';
}

/**
 * Helper to determine a reasonable default y-axis field
 * Prefers numeric fields that are not the x-axis
 */
function getDefaultYAxisField(data: any[], xAxisField: string): string {
  if (!data || data.length === 0) return '';
  
  const sample = data[0];
  const fields = Object.keys(sample);
  
  // Look for numeric fields
  const numericField = fields.find(field => 
    field !== xAxisField && 
    typeof sample[field] === 'number');
  
  if (numericField) return numericField;
  
  // Look for fields with numeric values
  const potentialNumericField = fields.find(field => 
    field !== xAxisField && 
    !isNaN(Number(sample[field])));
  
  if (potentialNumericField) return potentialNumericField;
  
  // Default to a field that's not the x-axis
  return fields.find(field => field !== xAxisField) || fields[0] || '';
}
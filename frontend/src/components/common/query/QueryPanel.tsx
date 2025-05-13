import { useState, useEffect } from 'react';
import { X, Play, Download, Copy, Info } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { CodeEditor } from '@/components/common/CodeEditor';
import { QueryResults } from '@/components/common/query/QueryResults';

import { useDuckDBStore } from '@/store/duckDBStore';
import { DataSourceType } from '@/types/json';

interface QueryPanelProps {
  data?: string[][];
  headers?: string[];
  fileName?: string;
  sourceType?: DataSourceType;
  rawData?: any;
  tableName?: string;
  onClose: () => void;
  isVisible: boolean;
}

export function QueryPanel({ 
  headers, 
  fileName, 
  tableName,
  onClose, 
  isVisible 
}: QueryPanelProps) {
  const [query, setQuery] = useState<string>('');
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [resultColumns, setResultColumns] = useState<string[] | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Use the DuckDB store instead of the hook
  const { 
    isLoading, 
    error, 
    isInitialized,
    executeQuery, 
    getAvailableTables
  } = useDuckDBStore();

  // Set initial query
  useEffect(() => {
    if (tableName && headers && headers.length > 0) {
      setQuery(`SELECT *\nFROM "${tableName}"\nLIMIT 10;`);
    }
  }, [tableName, headers]);

  const handleRunQuery = async () => {
    if (!query.trim()) return;
    
    const result = await executeQuery(query);
    
    if (result) {
      setQueryResults(result.toArray());
      setResultColumns(result.schema.fields.map(f => f.name));
    } else {
      setQueryResults(null);
      setResultColumns(null);
    }
  };

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query);
  };

  const handleDownloadResults = () => {
    if (!queryResults || !resultColumns) return;
    
    // Create CSV content
    const csvContent = [
      resultColumns.join(','),
      ...queryResults.map(row => 
        resultColumns.map(col => {
          const value = row[col];
          // Handle nulls and strings with commas
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `query_results_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get available tables
  const availableTables = getAvailableTables();

  // Dynamic width and transition classes
  const panelClasses = `
    fixed right-0 top-0 bottom-0 w-[30rem] bg-background border-l border-white border-opacity-10 flex flex-col
    transform transition-transform duration-300 ease-in-out z-20
    ${isVisible ? 'translate-x-0' : 'translate-x-full'}
  `;

  return (
    <div className={panelClasses}>
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-white border-opacity-10">
        <h3 className="font-heading font-medium">SQL Query</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X size={16} />
        </Button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Query Editor */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <h4 className="text-sm font-medium mr-2">Query Editor</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowHelp(!showHelp)}
              >
                <Info size={14} />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleCopyQuery}
              >
                <Copy size={14} className="mr-1" />
                <span className="text-xs">Copy</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="h-7 px-2"
                onClick={handleRunQuery}
                disabled={!isInitialized || isLoading}
              >
                <Play size={14} className="mr-1" />
                <span className="text-xs">Run</span>
              </Button>
            </div>
          </div>
          
          {showHelp && (
            <div className="mb-3 p-3 bg-darkNav rounded-md text-xs text-white text-opacity-70">
              <p className="mb-1">Available tables:</p>
              {availableTables.map(table => (
                <code key={table} className="bg-background px-1 py-0.5 rounded block mb-1">"{table}"</code>
              ))}
              <p className="mt-2 mb-1">Example queries:</p>
              {tableName && (
                <>
                  <code className="bg-background px-1 py-0.5 rounded block whitespace-pre mb-1">
                    {`SELECT * FROM "${tableName}" LIMIT 10;`}
                  </code>
                  <code className="bg-background px-1 py-0.5 rounded block whitespace-pre mb-1">
                    {`SELECT COUNT(*) FROM "${tableName}";`}
                  </code>
                  <code className="bg-background px-1 py-0.5 rounded block whitespace-pre">
                    {`SELECT * FROM "${tableName}" WHERE column_name = 'value';`}
                  </code>
                </>
              )}
            </div>
          )}
          
          <CodeEditor
            value={query}
            onChange={setQuery}
            className="mb-3"
          />
        </div>
        
        {/* Results */}
        <div className="border-t border-white border-opacity-10 flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4">
            <h4 className="text-sm font-medium">Results</h4>
            {queryResults && resultColumns && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleDownloadResults}
              >
                <Download size={14} className="mr-1" />
                <span className="text-xs">Download</span>
              </Button>
            )}
          </div>
          
          <div className="flex-1 overflow-auto p-4 pt-0">
            <QueryResults
              results={queryResults}
              columns={resultColumns}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="border-t border-white border-opacity-10 p-2 text-xs text-white text-opacity-50">
        {isInitialized ? (
          <span className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            DuckDB connected
          </span>
        ) : (
          <span className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
            Initializing DuckDB...
          </span>
        )}
      </div>
    </div>
  );
}
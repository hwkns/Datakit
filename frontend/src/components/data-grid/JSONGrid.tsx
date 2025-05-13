import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Database, FileJson } from 'lucide-react';
import { ColumnType } from '@/types/csv';

import { DataSourceType, JsonField } from '@/types/json';

import CSVGrid from './CSVGrid';

interface JSONGridProps {
  data?: string[][];
  columnTypes?: ColumnType[];
  rawData?: any;
  viewMode?: 'table' | 'tree';
  schema?: {
    fields: JsonField[];
    isNested: boolean;
    arrayDepth: number;
  };
}

const JSONGrid = ({ 
  data, 
  columnTypes = [], 
  rawData, 
  viewMode = 'table',
  schema
}: JSONGridProps) => {
  // State for view toggle
  const [currentView, setCurrentView] = useState<'table' | 'tree'>(viewMode);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Update view when prop changes
  useEffect(() => {
    setCurrentView(viewMode);
  }, [viewMode]);
  
  // Determine if JSON is deeply nested
  const isNested = useMemo(() => {
    if (schema) return schema.isNested;
    
    // Otherwise try to detect from rawData
    if (!rawData) return false;
    
    // Check for nested objects/arrays
    if (Array.isArray(rawData) && rawData.length > 0) {
      return rawData.some(item => 
        typeof item === 'object' && 
        item !== null && 
        Object.values(item).some(val => 
          val !== null && 
          typeof val === 'object'
        )
      );
    }
    
    if (typeof rawData === 'object' && rawData !== null) {
      return Object.values(rawData).some(val => 
        val !== null && 
        typeof val === 'object'
      );
    }
    
    return false;
  }, [rawData, schema]);
  
  // Toggle node expansion in tree view
  const toggleNode = (path: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  // Format value for display in tree view
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `Array(${value.length})`;
      }
      return `Object(${Object.keys(value).length} keys)`;
    }
    return String(value);
  };
  
  // Render tree node recursively
  const renderTreeNode = (key: string, value: any, path: string = '', depth: number = 0) => {
    const isObject = value !== null && typeof value === 'object';
    const isExpanded = expandedNodes.has(path);
    const fullPath = path ? `${path}.${key}` : key;
    
    return (
      <div key={fullPath} className="json-tree-node">
        <div 
          className={`flex items-center py-1 cursor-pointer hover:bg-gray-800 pl-${depth * 4}`}
          onClick={() => isObject && toggleNode(fullPath)}
        >
          {isObject && (
            <span className="mr-1 text-primary">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}
          
          <span className="json-key text-amber-300 mr-1">{key}:</span>
          
          {isObject ? (
            <span className="json-preview text-white text-opacity-70">
              {Array.isArray(value) 
                ? `Array(${value.length})` 
                : `Object(${Object.keys(value).length} keys)`}
            </span>
          ) : (
            <span className={`json-value ${typeof value === 'number' ? 'text-teal-400' : 'text-purple-400'}`}>
              {formatValue(value)}
            </span>
          )}
        </div>
        
        {isObject && isExpanded && (
          <div className="json-children pl-4">
            {Array.isArray(value) ? (
              value.map((item, index) => renderTreeNode(String(index), item, fullPath, depth + 1))
            ) : (
              Object.entries(value).map(([childKey, childValue]) => 
                renderTreeNode(childKey, childValue, fullPath, depth + 1)
              )
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Render tree view for JSON
  const renderTree = () => {
    if (!rawData) return null;
    
    return (
      <div className="json-tree bg-background text-white rounded p-4 overflow-auto">
        {typeof rawData === 'object' && rawData !== null ? (
          Array.isArray(rawData) ? (
            <div className="json-array">
              {rawData.map((item, index) => renderTreeNode(String(index), item, '', 0))}
            </div>
          ) : (
            <div className="json-object">
              {Object.entries(rawData).map(([key, value]) => renderTreeNode(key, value, '', 0))}
            </div>
          )
        ) : (
          <div className="json-primitive">{formatValue(rawData)}</div>
        )}
      </div>
    );
  };
  
  return (
    <div className="json-grid-container h-full">
      {/* Grid or Tree Content */}
      <div className="view-content h-full overflow-auto">
        {(currentView === 'table' || !isNested) ? (
          <CSVGrid data={data} columnTypes={columnTypes} />
        ) : (
          renderTree()
        )}
      </div>
    </div>
  );
};

export default JSONGrid;
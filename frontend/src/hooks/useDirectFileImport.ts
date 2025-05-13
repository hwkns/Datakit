import { useState, useCallback } from 'react';

import { useDuckDBStore } from '@/store/duckDBStore';

import useFileAccess, { FileAccessEntry } from '@/hooks/useFileAccess';

import { ColumnType } from '@/types/csv';
import { DataSourceType } from '@/types/json';

import { DataLoadWithDuckDBResult } from '@/components/layout/Sidebar';

export function useDirectFileImport() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  const { 
    importFileDirectly, 
    executeQuery,
    processingProgress,
    isLoading 
  } = useDuckDBStore();
  
  const {
    requestFile,
    openRecentFile,
    addRecentFile,
  } = useFileAccess();
  
  // Process a file through direct DuckDB import
  const processFile = useCallback(async (file: File, onDataLoad?: (result: DataLoadWithDuckDBResult) => void) => {
    try {
      setIsProcessing(true);
      setProcessingError(null);
      setLoadingStatus(`Starting direct import for: ${file.name}`);
      console.log(`[DirectImport] Starting direct import for: ${file.name}`);
      
      // Log file size
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      console.log(`[DirectImport] File size: ${fileSizeMB} MB`);
      
      // Add to recent files
      addRecentFile(file);
      
      // Get file extension
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (fileExt !== 'csv') {
        throw new Error('Direct import only supports CSV files currently');
      }
      
      // Start progress monitoring
      const progressWatcher = setInterval(() => {
        setLoadingProgress(processingProgress * 100);
      }, 100);
      
      try {
        // Import file directly to DuckDB
        setLoadingStatus('Importing file directly to DuckDB...');
        const { tableName, rowCount } = await importFileDirectly(file);
        
        // Get schema information
        const schemaResult = await executeQuery(`PRAGMA table_info("${tableName}")`);
        if (!schemaResult) {
          throw new Error('Failed to get table schema');
        }
        
        // Get data sample for display
        const sampleResult = await executeQuery(`SELECT * FROM "${tableName}" LIMIT 1000`);
        if (!sampleResult) {
          throw new Error('Failed to get data sample');
        }
        
        // Convert schema and sample to expected format for UI
        const headers = schemaResult.toArray().map(col => col.name);
        const sampleData = [
          headers,
          ...sampleResult.toArray().map(row => 
            headers.map(col => row[col] !== null ? String(row[col]) : '')
          )
        ];
        
        // Detect column types from schema
        const columnTypes = schemaResult.toArray().map(col => {
          const type = col.type.toLowerCase();
          if (type.includes('int') || type.includes('float') || type.includes('double') || type.includes('decimal')) {
            return ColumnType.Number;
          } else if (type.includes('bool')) {
            return ColumnType.Boolean;
          } else if (type.includes('date') || type.includes('time')) {
            return ColumnType.Date;
          } else {
            return ColumnType.Text;
          }
        });
        
        // Create a result object for the UI
        const result: DataLoadWithDuckDBResult = {
          data: sampleData,
          columnTypes,
          fileName: file.name,
          rowCount,       // This is the actual row count in the DB
          columnCount: headers.length,
          sourceType: DataSourceType.CSV,
          loadedToDuckDB: true,
          tableName
        };
        
        // Call the callback with the result
        if (onDataLoad) {
          console.log(`[DirectImport] Calling onDataLoad callback with import result`);
          onDataLoad(result);
        }
        
        setLoadingStatus('Import completed successfully');
        return result;
      } finally {
        clearInterval(progressWatcher);
      }
    } catch (err) {
      console.error(`[DirectImport] Error importing file:`, err);
      setProcessingError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setLoadingStatus('Import failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [addRecentFile, importFileDirectly, executeQuery, processingProgress]);
  
  // Handle upload button click
  const handleUploadClick = useCallback(async (onDataLoad?: (result: DataLoadWithDuckDBResult) => void) => {
    try {
      setLoadingStatus('Selecting file...');
      
      const file = await requestFile();
      if (file) {
        return await processFile(file, onDataLoad);
      } else {
        // User cancelled
        setLoadingStatus('');
        return null;
      }
    } catch (err) {
      console.error(`[DirectImport] Error requesting file:`, err);
      setProcessingError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setLoadingStatus('Error');
      return null;
    }
  }, [requestFile, processFile]);
  
  // Handle recent file selection
  const handleRecentFileSelect = useCallback(async (fileEntry: FileAccessEntry, onDataLoad?: (result: DataLoadWithDuckDBResult) => void) => {
    try {
      setIsProcessing(true);
      setProcessingError(null);
      setLoadingStatus(`Opening recent file: ${fileEntry.name}`);
      
      const file = await openRecentFile(fileEntry);
      if (file) {
        return await processFile(file, onDataLoad);
      } else {
        throw new Error('Failed to open recent file');
      }
    } catch (err) {
      console.error(`[DirectImport] Error opening recent file:`, err);
      setProcessingError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setLoadingStatus('Error');
      setIsProcessing(false);
      return null;
    }
  }, [openRecentFile, processFile]);
  
  return {
    handleUploadClick,
    handleRecentFileSelect,
    processFile,
    isProcessing,
    loadingStatus,
    loadingProgress,
    processingError,
    setLoadingStatus,
    setProcessingError
  };
}

export default useDirectFileImport;
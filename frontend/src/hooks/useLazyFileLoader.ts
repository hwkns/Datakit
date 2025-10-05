import { useState, useCallback } from 'react';
import { useFolderStore } from '@/store/folderStore';
import { useDuckDBStore } from '@/store/duckDBStore';
import { useAppStore } from '@/store/appStore';
import { FolderNode } from '@/types/folder';
import useDirectFileImport from '@/hooks/useDirectFileImport';
import { DataLoadWithDuckDBResult } from '@/components/layout/Sidebar';

export function useLazyFileLoader() {
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { getNodeById, updateFileData, markFileAsLoaded } = useFolderStore();
  const { processFileStreaming, processFile } = useDirectFileImport();
  const { addFile: addToAppStore, setActiveFile } = useAppStore();

  const loadFile = useCallback(async (
    node: FolderNode,
    onDataLoad?: (result: DataLoadWithDuckDBResult) => void
  ) => {
    if (node.type !== 'file' || !node.fileData) {
      setError('Invalid file node');
      return false;
    }

    // If file is already loaded, just switch to it
    if (node.fileData.isLoaded && node.fileData.tableName) {
      console.log(`[LazyLoader] File already loaded: ${node.name} (${node.fileData.tableName})`);
      
      // Find the file in app store and set it active
      const appFiles = useAppStore.getState().files;
      const existingFile = appFiles.find(f => f.fileName === node.name);
      if (existingFile) {
        setActiveFile(existingFile.id);
        return true;
      }
    }

    setLoadingFileId(node.id);
    setError(null);

    try {
      console.log(`[LazyLoader] Loading file: ${node.name}`);
      
      let result: DataLoadWithDuckDBResult | undefined;

      // Check if we have a file handle for streaming
      if (node.fileData.handle) {
        // Try to get the file from handle
        try {
          const file = await node.fileData.handle.getFile();
          
          // Check if file still exists and matches
          if (file.name === node.name) {
            console.log(`[LazyLoader] Using file handle for streaming import`);
            result = await processFileStreaming(node.fileData.handle, file, onDataLoad);
          } else {
            throw new Error('File name mismatch');
          }
        } catch (handleError) {
          console.warn(`[LazyLoader] File handle failed, prompting user:`, handleError);
          
          // Prompt user to re-select the file
          if ('showOpenFilePicker' in window) {
            const fileHandleArray = await window.showOpenFilePicker({
              types: [
                {
                  description: 'Data Files',
                  accept: {
                    'text/csv': ['.csv'],
                    'application/json': ['.json'],
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                    'application/vnd.ms-excel': ['.xls'],
                    'application/x-parquet': ['.parquet'],
                    'application/vnd.apache.parquet': ['.parquet'],
                    'text/plain': ['.txt'],
                    'application/octet-stream': ['.duckdb', '.db'],
                  },
                },
              ],
              excludeAcceptAllOption: false,
              multiple: false,
            });

            if (fileHandleArray.length > 0) {
              const selectedHandle = fileHandleArray[0];
              const selectedFile = await selectedHandle.getFile();
              
              if (selectedFile.name === node.name) {
                // Update the handle in the store
                updateFileData(node.id, { handle: selectedHandle });
                
                result = await processFileStreaming(selectedHandle, selectedFile, onDataLoad);
              } else {
                throw new Error(`Please select the correct file: ${node.name}`);
              }
            }
          }
        }
      } else if (node.fileData.isRemote && node.fileData.remoteUrl) {
        // Handle remote files
        console.log(`[LazyLoader] Loading remote file: ${node.fileData.remoteUrl}`);
        // This would need implementation for remote file loading
        throw new Error('Remote file loading not yet implemented in lazy loader');
      } else {
        // No handle available, prompt user to select file
        throw new Error('File handle not available, please re-import the file');
      }

      if (result) {
        // Mark file as loaded in folder store
        markFileAsLoaded(node.id, result.tableName || node.name);
        
        // Add to app store for file tabs
        const fileId = addToAppStore(result);
        setActiveFile(fileId);
        
        console.log(`[LazyLoader] File loaded successfully: ${node.name}`);
        setLoadingFileId(null);
        return true;
      }

    } catch (error) {
      console.error(`[LazyLoader] Failed to load file:`, error);
      setError(error instanceof Error ? error.message : 'Failed to load file');
      setLoadingFileId(null);
      return false;
    }

    setLoadingFileId(null);
    return false;
  }, [processFileStreaming, processFile, updateFileData, markFileAsLoaded, addToAppStore, setActiveFile]);

  const isLoading = useCallback((nodeId: string) => {
    return loadingFileId === nodeId;
  }, [loadingFileId]);

  return {
    loadFile,
    isLoading,
    loadingFileId,
    error,
  };
}
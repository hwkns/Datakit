import { useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { useFolderStore } from '@/store/folderStore';
import useDirectFileImport from '@/hooks/useDirectFileImport';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { WorkspaceFile } from '@/types/folder';
import { DataLoadWithDuckDBResult } from '@/types/multiFile';

// Helper function to check File System Access API support
const isFileSystemAccessSupported = (): boolean => {
  return 'showOpenFilePicker' in window && 'FileSystemFileHandle' in window;
};

// File picker configuration
const FILE_PICKER_CONFIG = {
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
};

export const useFileImport = () => {
  const { t } = useTranslation();
  const analytics = useAnalytics();
  const { showSuccess, showError } = useNotifications();
  
  // Stores
  const { addFile, addFileToWorkspace } = useAppStore();
  const { addFile: addFileToFolder, draftFolderId, expandFolder } = useFolderStore();
  
  // Import hooks
  const { processFile, processFileStreaming, isProcessing } = useDirectFileImport();

  // Create workspace file from File object
  const createWorkspaceFile = useCallback((file: File, handle?: FileSystemFileHandle): WorkspaceFile => {
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'txt';
    const workspaceFileType = fileType === 'xlsx' || fileType === 'xls' ? 'excel' : fileType as WorkspaceFile['type'];
    
    return {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: workspaceFileType,
      size: file.size,
      lastModified: file.lastModified,
      handle: handle, // May be undefined for drag/drop or fallback
    };
  }, []);

  // Add file to all stores (unified logic) with duplicate detection
  const addToAllStores = useCallback((
    file: File, 
    result: DataLoadWithDuckDBResult, 
    handle?: FileSystemFileHandle,
    targetFolderId?: string
  ) => {
    // Check if file is already open in app store
    const { files, setActiveFile, workspaceFiles } = useAppStore.getState();
    const existingFile = files.find(f => f.fileName === file.name);
    
    if (existingFile) {
      console.log('[UnifiedFileImport] File already open, switching to existing tab:', file.name);
      setActiveFile(existingFile.id);
      
      // Check if we should add to target folder (for drag & drop to specific folders)
      if (targetFolderId) {
        const fileType = file.name.split('.').pop()?.toLowerCase() || 'txt';
        const { getChildren } = useFolderStore.getState();
        const folderChildren = getChildren(targetFolderId);
        const existingInFolder = folderChildren.find(node => 
          node.type === 'file' && 
          node.name === file.name
        );
        
        if (!existingInFolder) {
          console.log('[UnifiedFileImport] Adding existing file to target folder:', targetFolderId);
          addFileToFolder(file, {
            handle,
            size: file.size,
            lastModified: file.lastModified,
            fileType: fileType as any,
            isLoaded: true,
            tableName: result.tableName,
          }, targetFolderId);
          
          // Ensure file is in workspace files for persistence (even without handle)
          const existingWorkspaceFile = workspaceFiles.find(f => f.name === file.name);
          if (!existingWorkspaceFile) {
            console.log('[UnifiedFileImport] Adding file to workspace for persistence');
            const workspaceFile = createWorkspaceFile(file, handle);
            addFileToWorkspace(workspaceFile);
          }
          
          // Expand the target folder
          expandFolder(targetFolderId);
        }
      }
      
      
      return existingFile.id;
    }

    // File doesn't exist, proceed with normal creation
    console.log('[UnifiedFileImport] Creating new file entry for:', file.name);
    
    // Add to app store (for tabs/preview)
    const fileId = addFile(result);
    
    // Add to workspace files (for persistence) - check for duplicate workspace files
    const existingWorkspaceFile = workspaceFiles.find(f => f.name === file.name);
    if (!existingWorkspaceFile) {
      const workspaceFile = createWorkspaceFile(file, handle);
      addFileToWorkspace(workspaceFile);
    } else {
      console.log('[UnifiedFileImport] Workspace file already exists, updating handle if needed');
      // Update handle if the new one is better (has handle vs no handle)
      if (handle && !existingWorkspaceFile.handle) {
        const { updateWorkspaceFile } = useAppStore.getState();
        updateWorkspaceFile(existingWorkspaceFile.id, { handle });
      }
    }
    
    // Add to folder store (for tree view)
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'txt';
    const finalFolderId = targetFolderId || draftFolderId || undefined;
    
    console.log('[addToAllStores] Adding to folder store - finalFolderId:', finalFolderId, 'fileType:', fileType);
    
    addFileToFolder(file, {
      handle,
      size: file.size,
      lastModified: file.lastModified,
      fileType: fileType as any,
      isLoaded: true,
      tableName: result.tableName,
    }, finalFolderId);

    // Expand the target folder
    if (finalFolderId) {
      expandFolder(finalFolderId);
    }

    // Track analytics
    analytics.trackFileUpload(result);

    // Show success notification
    showSuccess(
      t('layout.sidebar.fileImported'),
      t('layout.sidebar.fileImportedMessage', { fileName: file.name }),
      { icon: 'check', duration: 5000 }
    );

    return fileId;
  }, [addFile, addFileToWorkspace, addFileToFolder, createWorkspaceFile, draftFolderId, expandFolder, analytics, showSuccess, t]);

  // Import single file with handle (File System Access API)
  const importFileWithHandle = useCallback(async (
    handle: FileSystemFileHandle,
    file: File,
    onDataLoad?: (result: DataLoadWithDuckDBResult) => void,
    targetFolderId?: string
  ) => {
    console.log('[UnifiedFileImport] Importing file with handle:', file.name);
    
    try {
      const result = await processFileStreaming(handle, file, onDataLoad);
      
      if (result) {
        addToAllStores(file, result, handle, targetFolderId);
        return result;
      }
    } catch (error) {
      console.error('[UnifiedFileImport] Error importing file with handle:', error);
      showError(
        t('sidebar.importError'),
        error instanceof Error ? error.message : 'Failed to import file'
      );
      throw error;
    }
  }, [processFileStreaming, addToAllStores, showError, t]);

  // Import single file without handle (fallback)
  const importFile = useCallback(async (
    file: File,
    onDataLoad?: (result: DataLoadWithDuckDBResult) => void,
    targetFolderId?: string
  ) => {
    console.log('[UnifiedFileImport] Importing file without handle:', file.name);
    
    try {
      const result = await processFile(file, onDataLoad);
      
      if (result) {
        addToAllStores(file, result, undefined, targetFolderId);
        return result;
      }
    } catch (error) {
      console.error('[UnifiedFileImport] Error importing file:', error);
      showError(
        t('sidebar.importError'),
        error instanceof Error ? error.message : 'Failed to import file'
      );
      throw error;
    }
  }, [processFile, addToAllStores, showError, t]);

  // Open file picker and import files
  const openFilePicker = useCallback(async (
    onDataLoad?: (result: DataLoadWithDuckDBResult) => void,
    targetFolderId?: string,
    multiple: boolean = true
  ) => {
    console.log('[UnifiedFileImport] Opening file picker');
    
    // Try File System Access API first
    if (isFileSystemAccessSupported()) {
      try {
        const fileHandles = await window.showOpenFilePicker({
          ...FILE_PICKER_CONFIG,
          multiple,
        });

        const results = [];
        for (const handle of fileHandles) {
          const file = await handle.getFile();
          const result = await importFileWithHandle(handle, file, onDataLoad, targetFolderId);
          if (result) results.push(result);
        }
        
        return results;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.warn('[UnifiedFileImport] File System Access API failed, falling back:', error);
        } else {
          return []; // User cancelled
        }
      }
    }

    // Fallback to regular file input
    return new Promise<DataLoadWithDuckDBResult[]>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = multiple;
      input.accept = '.csv,.json,.xlsx,.xls,.parquet,.txt,.duckdb,.db';
      
      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        const results = [];
        
        for (const file of files) {
          const result = await importFile(file, onDataLoad, targetFolderId);
          if (result) results.push(result);
        }
        
        resolve(results);
      };
      
      input.click();
    });
  }, [importFileWithHandle, importFile]);

  // Import multiple files (for drag & drop)
  const importFiles = useCallback(async (
    files: File[],
    onDataLoad?: (result: DataLoadWithDuckDBResult) => void,
    targetFolderId?: string
  ) => {
    console.log('[UnifiedFileImport] Importing multiple files:', files.length, 'targetFolderId:', targetFolderId);
    
    const results = [];
    for (const file of files) {
      try {
        console.log('[UnifiedFileImport] Processing file:', file.name);
        const result = await importFile(file, onDataLoad, targetFolderId);
        console.log('[UnifiedFileImport] File processed successfully:', file.name, 'result:', !!result);
        if (result) results.push(result);
      } catch (error) {
        console.error('[UnifiedFileImport] Error importing file:', file.name, error);
        // Continue with other files
      }
    }
    
    console.log('[UnifiedFileImport] All files processed, results count:', results.length);
    return results;
  }, [importFile]);

  // Reopen file using workspace file (handles stale handles)
  const reopenWorkspaceFile = useCallback(async (
    workspaceFile: WorkspaceFile,
    onDataLoad?: (result: DataLoadWithDuckDBResult) => void
  ) => {
    console.log('[UnifiedFileImport] Reopening workspace file:', workspaceFile.name);
    
    // First try to use the stored handle
    if (workspaceFile.handle) {
      try {
        // First, try to request permission for the stored handle
        // This will show the "Allow this site to view and copy X.txt?" prompt
        console.log('[UnifiedFileImport] Requesting permission for stored handle');
        const permission = await workspaceFile.handle.requestPermission({ mode: 'read' });
        
        if (permission === 'granted') {
          console.log('[UnifiedFileImport] Permission granted for stored handle');
          const file = await workspaceFile.handle.getFile();
          
          // Verify the file name matches (use originalName if available)
          const expectedName = workspaceFile.originalName || workspaceFile.name;
          if (file.name === expectedName) {
            console.log('[UnifiedFileImport] Using stored handle successfully after permission grant');
            return await importFileWithHandle(workspaceFile.handle, file, onDataLoad);
          } else {
            throw new Error('File name mismatch');
          }
        } else {
          console.warn('[UnifiedFileImport] Permission denied for stored handle');
          throw new Error('Permission denied for stored file handle');
        }
      } catch (handleError) {
        console.warn('[UnifiedFileImport] Stored handle failed or permission denied:', handleError);
      }
    }
    
    // Handle failed or not available - prompt user to reselect
    console.log('[UnifiedFileImport] Prompting user to reselect file');
    
    if (isFileSystemAccessSupported()) {
      try {
        const [newHandle] = await window.showOpenFilePicker({
          ...FILE_PICKER_CONFIG,
          multiple: false,
        });
        
        const selectedFile = await newHandle.getFile();
        
        // Verify the selected file matches the workspace file (use originalName if available)
        const expectedName = workspaceFile.originalName || workspaceFile.name;
        if (selectedFile.name === expectedName) {
          // Update the workspace file with the new handle
          const { updateWorkspaceFile } = useAppStore.getState();
          updateWorkspaceFile(workspaceFile.id, { handle: newHandle });
          
          console.log('[UnifiedFileImport] Updated handle for workspace file');
          return await importFileWithHandle(newHandle, selectedFile, onDataLoad);
        } else {
          throw new Error(`Please select the correct file: ${expectedName}`);
        }
      } catch (pickerError) {
        if ((pickerError as Error).name !== 'AbortError') {
          showError(
            t('sidebar.fileLoadError', 'Failed to Load File'),
            pickerError instanceof Error ? pickerError.message : 'Failed to select file'
          );
        }
        throw pickerError;
      }
    } else {
      showError(
        t('sidebar.fileLoadError', 'Failed to Load File'),
        'File handle not available and browser does not support file picker. Please re-import the file.'
      );
      throw new Error('File handle not available');
    }
  }, [importFileWithHandle, showError, t]);

  return {
    // Core import methods
    importFile,
    importFileWithHandle,
    importFiles,
    openFilePicker,
    reopenWorkspaceFile,
    
    // Utilities
    isFileSystemAccessSupported: isFileSystemAccessSupported(),
    isProcessing,
    
    // For backwards compatibility
    handleButtonClick: () => openFilePicker(),
    handleFileSelect: importFiles,
  };
};
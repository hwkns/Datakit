import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FolderOpen } from 'lucide-react';
import { useFolderStore } from '@/store/folderStore';
import { cn } from '@/lib/utils';

interface GlobalDropZoneProps {
  onFileDrop?: (files: File[], targetFolderId?: string, handles?: (FileSystemFileHandle | undefined)[]) => Promise<void>;
  isProcessing?: boolean;
}

export const GlobalDropZone: React.FC<GlobalDropZoneProps> = ({
  onFileDrop,
  isProcessing = false,
}) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  const { selectedIds, getNodeById, draftFolderId } = useFolderStore();

  // Get target folder for drop
  const getTargetFolder = useCallback(() => {
    // If a folder is selected, use it
    const selectedId = Array.from(selectedIds)[0];
    if (selectedId) {
      const node = getNodeById(selectedId);
      if (node?.type === 'folder') {
        return { id: selectedId, name: node.name };
      }
      // If file is selected, use its parent folder
      if (node?.parentId) {
        const parentNode = getNodeById(node.parentId);
        if (parentNode) {
          return { id: parentNode.id, name: parentNode.name };
        }
      }
    }
    
    // Default to Draft folder - ensure we always have a valid draft folder ID
    if (draftFolderId) {
      const draftNode = getNodeById(draftFolderId);
      return { id: draftFolderId, name: draftNode?.name || 'Draft' };
    }
    
    // Fallback - this shouldn't happen if folder store is properly initialized
    return { id: 'draft-fallback', name: 'Draft' };
  }, [selectedIds, getNodeById, draftFolderId]);

  // Handle drag enter
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    
    // Only handle file drags
    if (e.dataTransfer?.types.includes('Files')) {
      setDragCounter(prev => prev + 1);
      if (dragCounter === 0) {
        setIsDragging(true);
      }
    }
  }, [dragCounter]);

  // Handle drag leave
  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length === 0) return;

    // Filter for supported file types
    const supportedExtensions = ['csv', 'json', 'xlsx', 'xls', 'parquet', 'txt', 'duckdb', 'db'];
    const supportedFiles = files.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && supportedExtensions.includes(ext);
    });

    if (supportedFiles.length === 0) {
      alert(t('dropZone.unsupportedFiles', 'No supported files found. Supported formats: CSV, JSON, Excel, Parquet, TXT, DuckDB'));
      return;
    }

    const targetFolder = getTargetFolder();
    const finalTargetId = targetFolder.id === 'draft-fallback' ? (draftFolderId || undefined) : targetFolder.id;
    
    try {
      // Try to get file handles from drag & drop for persistent access
      const items = Array.from(e.dataTransfer?.items || []);
      const fileHandles: FileSystemFileHandle[] = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          if (item?.getAsFileSystemHandle) {
            const handle = await item.getAsFileSystemHandle();
            if (handle?.kind === 'file') {
              console.log('[GlobalDropZone] Got file handle for:', supportedFiles[i]?.name);
              fileHandles.push(handle as FileSystemFileHandle);
            } else {
              fileHandles.push(undefined as any);
            }
          } else {
            fileHandles.push(undefined as any);
          }
        } catch (error) {
          console.warn('[GlobalDropZone] Could not get file handle for item:', i, error);
          fileHandles.push(undefined as any);
        }
      }
      
      if (onFileDrop) {
        console.log('[GlobalDropZone] Dropping files to folder:', finalTargetId, targetFolder.name, 'with handles:', fileHandles.filter(Boolean).length);
        
        // Pass both files and handles to enable persistent access
        await onFileDrop(supportedFiles, finalTargetId, fileHandles);
      }
    } catch (error) {
      console.error('Drop error:', error);
    }
  }, [onFileDrop, getTargetFolder, t, draftFolderId]);

  // Set up global event listeners
  useEffect(() => {
    const handleDragEnterGlobal = (e: DragEvent) => handleDragEnter(e);
    const handleDragLeaveGlobal = (e: DragEvent) => handleDragLeave(e);
    const handleDragOverGlobal = (e: DragEvent) => handleDragOver(e);
    const handleDropGlobal = (e: DragEvent) => handleDrop(e);

    document.addEventListener('dragenter', handleDragEnterGlobal);
    document.addEventListener('dragleave', handleDragLeaveGlobal);
    document.addEventListener('dragover', handleDragOverGlobal);
    document.addEventListener('drop', handleDropGlobal);

    return () => {
      document.removeEventListener('dragenter', handleDragEnterGlobal);
      document.removeEventListener('dragleave', handleDragLeaveGlobal);
      document.removeEventListener('dragover', handleDragOverGlobal);
      document.removeEventListener('drop', handleDropGlobal);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  const targetFolder = getTargetFolder();

  return (
    <AnimatePresence>
      {(isDragging) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] pointer-events-none"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Drop area */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ 
                scale: 1, 
                y: 0
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30
              }}
              className="relative bg-dark backdrop-blur-md rounded-2xl border-2 border-dashed border-primary p-12 max-w-md w-full mx-auto text-center"
            >
              {/* Icon */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mb-6"
              >
                <Upload className="w-16 h-16 text-primary mx-auto" />
              </motion.div>

              {/* Text */}
              <div>
                {isProcessing ? (
                  <>
                    <h2 className="text-2xl font-bold text-primary mb-2">
                      {t('dropZone.processing', 'Processing Files...')}
                    </h2>
                    <p className="text-white/70">
                      {t('dropZone.processingMessage', 'Please wait while we import your files')}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {t('dropZone.title', 'Drop Files to Import')}
                    </h2>
                    <p className="text-white/70 mb-4">
                      {t('dropZone.description', 'Release to add files to your workspace')}
                    </p>
                    
                    {/* Target folder indicator */}
                    <div className="flex items-center justify-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                      <FolderOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm text-white font-medium">
                        {t('dropZone.targetFolder', 'Target: {{folder}}', {
                          folder: targetFolder.name
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Supported formats */}
              {!isProcessing && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-white/50 mt-4"
                >
                  {t('dropZone.supportedFormats', 'CSV, JSON, Excel, Parquet, TXT, DuckDB')}
                </motion.p>
              )}

              {/* Animated border */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                animate={{
                  scale: [1, 1.02, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
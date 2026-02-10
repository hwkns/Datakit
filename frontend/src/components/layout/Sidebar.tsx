import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ExternalLink, Settings } from 'lucide-react';

import { GlobalDropZone } from '@/components/common/GlobalDropZone';
import { SidebarToolbar } from '@/components/workspace/SidebarToolbar';
import { FolderTreeView } from '@/components/workspace/FolderTreeView';
import { SettingsPopover } from '@/components/common/SettingsPopover';
import { Tooltip } from '@/components/ui/Tooltip';
import { useDuckDBStore } from '@/store/duckDBStore';
import { useFolderStore } from '@/store/folderStore';
import { useAppStore } from '@/store/appStore';
import { useFileImport } from '@/hooks/useFileImport';
import { motion } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { FolderNode } from '@/types/folder';

import UserMenu from '@/components/auth/UserMenu';
import DuckDBIcon from '@/assets/duckdb.svg';
import RemoteDataImportModal from '@/components/common/RemoteDataImportPanel';
import HelpDropdown from '@/components/common/HelpDropdown';
import SidebarFeedbackButton from '@/components/common/SidebarFeedbackButton';

import { ColumnType } from '@/types/csv';
import { DataSourceType } from '@/types/json';
import { ImportProvider } from '@/types/remoteImport';

export interface DataLoadWithDuckDBResult {
  data: string[][];
  columnTypes: ColumnType[];
  fileName: string;
  rowCount: number;
  columnCount: number;
  sourceType?: DataSourceType;
  rawData?: any;
  schema?: any;
  loadedToDuckDB: boolean;
  tableName?: string;
  isRemote?: boolean;
  remoteURL?: string;
  isStreamingImport?: boolean;
  remoteProvider?: ImportProvider;
  convertedFromExcel?: boolean;
  isDatabaseAttachment?: boolean;
  attachedTables?: string[];
}

interface SidebarProps {
  onDataLoad?: (result: DataLoadWithDuckDBResult) => void;
}

// Check for custom logo from environment variable or window object
const customLogoUrl =
  import.meta.env.VITE_CUSTOM_LOGO_URL || (window as any).CUSTOM_LOGO_URL;

const Sidebar: React.FC<SidebarProps> = ({ onDataLoad }) => {
  const { t } = useTranslation();
  const {
    sidebarCollapsed,
    toggleSidebar,
    isRemoteModalOpen,
    setIsRemoteModalOpen
  } = useAppStore();
  
  // Handle settings navigation
  const handleOpenSettings = () => {
    window.location.href = '/settings';
  };

  // Removed file checking - Help & Support always shows

  // Sidebar resizing state
  const [sidebarWidth, setSidebarWidth] = useState(200); // Default 200px
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Initialize CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      `${sidebarWidth}px`
    );
  }, []);

  const { showSuccess, showError } = useNotifications();

  // Folder store
  const {
    initializeStore,
    draftFolderId,
    remoteFolderId,
    addFile: addFileToFolder,
    getNodeById,
    expandFolder,
  } = useFolderStore();

  // Unified file import
  const {
    importFileWithHandle,
    importFiles,
    reopenWorkspaceFile,
    isProcessing: isProcessingLocalFile,
  } = useFileImport();

  const {
    isLoading: duckDBLoading,
    processingProgress: duckDBProgress,
    error: duckDBError,
  } = useDuckDBStore();

  // Initialize folder store on mount
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Resize handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    // Disable transitions during resize
    if (sidebarRef.current) {
      sidebarRef.current.classList.add('sidebar-resizing');
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      e.preventDefault();
      const newWidth = Math.min(Math.max(200, e.clientX), 500); // Min 200px (default), max 500px

      // Direct CSS custom property update - instant and smooth
      document.documentElement.style.setProperty(
        '--sidebar-width',
        `${newWidth}px`
      );
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const finalWidth = Math.min(Math.max(200, e.clientX), 500); // Min 200px (default), max 500px

      // Re-enable transitions
      sidebarRef.current.classList.remove('sidebar-resizing');

      // Update React state for persistence
      setSidebarWidth(finalWidth);
      setIsResizing(false);

      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    if (isResizing) {
      document.body.style.userSelect = 'none'; // Disable text selection during drag
      document.body.style.cursor = 'col-resize'; // Set cursor globally

      document.addEventListener('mousemove', handleMouseMove, {
        passive: false,
      });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isResizing]);

  // Handle file import with streaming support (unified)
  const handleFileWithStreaming = async (
    handle: FileSystemFileHandle,
    file: File
  ) => {
    console.log(
      '[handleFileWithStreaming] Using unified import for:',
      file.name
    );

    return await importFileWithHandle(
      handle,
      file,
      onDataLoad,
      draftFolderId || undefined
    );
  };

  // Handle regular file import (unified)
  const handleFileImport = async (file: File) => {
    console.log('[handleFileImport] Using unified import for:', file.name);

    return await importFiles([file], onDataLoad, draftFolderId || undefined);
  };

  // Handle remote data import
  const handleRemoteDataImport = (result: DataLoadWithDuckDBResult) => {
    if (onDataLoad) {
      onDataLoad(result);

      // Add remote file to Remote Sources folder
      if (result.isRemote) {
        const file = new File([], result.fileName, {
          lastModified: Date.now(),
        });
        addFileToFolder(
          file,
          {
            isRemote: true,
            remoteUrl: result.remoteURL,
            fileType: 'remote',
            isLoaded: true,
            tableName: result.tableName,
          },
          remoteFolderId || undefined
        );

        showSuccess(
          t('sidebar.remote.importedTitle'),
          t('sidebar.remote.importedMessage', {
            fileName: result.fileName,
            provider:
              result.remoteProvider || t('sidebar.remote.defaultProvider'),
          }),
          { icon: 'check', duration: 5000 }
        );
      }
    }
  };

  // Handle file selection from tree (unified)
  const handleFileSelect = async (node: FolderNode) => {
    console.log('[Sidebar] File selected from tree:', {
      fileName: node.name,
      nodeType: node.type,
      fileData: node.fileData,
      hasHandle: !!node.fileData?.handle,
      isLoaded: node.fileData?.isLoaded,
      tableName: node.fileData?.tableName,
      isTemporary: node.fileData?.isTemporary,
    });

    if (node.type !== 'file') return;

    // Special handling for temporary tables
    if (node.fileData?.isTemporary && node.fileData?.tableName) {
      console.log('[Sidebar] Opening temporary table:', node.fileData.tableName);
      const { files, setActiveFile, addFile } = useAppStore.getState();
      
      // Check if this temporary table is already open
      const existingFile = files.find((f) => f.tableName === node.fileData?.tableName);
      if (existingFile) {
        console.log('[Sidebar] Temporary table already open, switching to it');
        setActiveFile(existingFile.id);
        return;
      }
      
      // Create a new tab for this temporary table
      const tempTableData = {
        data: [], // Data will be queried from DuckDB
        columnTypes: [],
        fileName: node.name.replace(/\.sql$/, ''), // Remove .sql extension if present
        rowCount: node.fileData.rowCount || 0,
        columnCount: node.fileData.columnCount || 0,
        sourceType: 'TABLE' as any, // Mark as TABLE type
        loadedToDuckDB: true,
        tableName: node.fileData.tableName,
        isTemporary: true,
        metadata: {
          isTemporary: true,
          sourceFileName: node.fileData.sourceFileName,
        }
      };
      
      addFile(tempTableData);
      console.log('[Sidebar] Created new tab for temporary table:', node.fileData.tableName);
      return;
    }

    // Special handling for saved tables (from AI "Keep Results")
    // Only handle tables that are specifically marked as saved tables and don't have workspace files
    if (node.fileData?.tableName && node.fileData?.isLoaded && !node.fileData?.isTemporary && node.fileData?.fileType === 'query') {
      console.log('[Sidebar] Opening saved table:', node.fileData.tableName);
      const { files, setActiveFile, addFile } = useAppStore.getState();
      
      // Check if this saved table is already open
      const existingFile = files.find((f) => f.tableName === node.fileData?.tableName);
      if (existingFile) {
        console.log('[Sidebar] Saved table already open, switching to it');
        setActiveFile(existingFile.id);
        return;
      }
      
      // Create a new tab for this saved table
      const savedTableData = {
        data: [], // Data will be queried from DuckDB
        columnTypes: [],
        fileName: node.name,
        rowCount: node.fileData.rowCount || 0,
        columnCount: node.fileData.columnCount || 0,
        sourceType: 'TABLE' as any, // Mark as TABLE type
        loadedToDuckDB: true,
        tableName: node.fileData.tableName,
        metadata: {
          isSavedTable: true,
          originalName: node.name,
        }
      };
      
      addFile(savedTableData);
      console.log('[Sidebar] Created new tab for saved table:', node.fileData.tableName);
      return;
    }

    // Find the workspace file corresponding to this folder node
    const { workspaceFiles, files, setActiveFile } = useAppStore.getState();

    // Try to match by handle first (most reliable), then by name
    let workspaceFile = workspaceFiles.find(
      (f) =>
        node.fileData?.handle && f.handle && f.handle === node.fileData.handle
    );

    // Fallback to name matching if handle matching fails
    if (!workspaceFile) {
      workspaceFile = workspaceFiles.find(
        (f) => f.name === node.name || f.originalName === node.name
      );
    }

    console.log(
      '[Sidebar] Found workspace file:',
      !!workspaceFile,
      workspaceFile
    );

    if (workspaceFile) {
      // Check if file is already loaded in app store
      const existingFile = files.find((f) => f.fileName === workspaceFile.name);
      if (existingFile) {
        console.log('[Sidebar] File already in app store, switching to it');
        setActiveFile(existingFile.id);
        return;
      }

      // Use unified reopen logic
      try {
        const result = await reopenWorkspaceFile(workspaceFile, onDataLoad);
        if (result) {
          console.log(
            '[Sidebar] File reopened successfully using unified import'
          );
        }
      } catch (error) {
        console.error('[Sidebar] Failed to reopen file:', error);
      }
    } else {
      console.warn('[Sidebar] No workspace file found for:', node.name);

      // For files without handles (drag & drop), check if they're already in app store
      const existingFile = files.find((f) => f.fileName === node.name);
      if (existingFile) {
        console.log(
          '[Sidebar] File found in app store, switching to existing tab'
        );
        setActiveFile(existingFile.id);
        return;
      }

      // File is completely missing - show error and suggest re-import
      showError(
        t('sidebar.fileLoadError', 'Failed to Load File'),
        'Please re-import the file using the import button.'
      );
    }
  };

  // Handle folder selection
  const handleFolderSelect = (node: FolderNode) => {
    console.log('[Sidebar] Folder selected:', node);
    // Could implement folder-level actions here
  };

  // Handle global file drop (unified)
  const handleGlobalFileDrop = async (
    files: File[],
    targetFolderId?: string,
    handles?: (FileSystemFileHandle | undefined)[]
  ) => {
    console.log(
      '[handleGlobalFileDrop] Using unified import for:',
      files.length,
      'files',
      'targetFolderId:',
      targetFolderId,
      'draftFolderId:', draftFolderId,
      'handles:',
      handles?.filter(Boolean).length || 0
    );

    const finalFolderId = targetFolderId || draftFolderId || undefined;
    console.log('[handleGlobalFileDrop] Final folder ID:', finalFolderId);

    try {
      const results = [];

      // Process each file with its corresponding handle
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const handle = handles?.[i];

        if (handle) {
          console.log(
            '[handleGlobalFileDrop] Using handle for file:',
            file.name
          );
          const result = await importFileWithHandle(
            handle,
            file,
            onDataLoad,
            finalFolderId
          );
          if (result) results.push(result);
        } else {
          console.log(
            '[handleGlobalFileDrop] No handle available for file:',
            file.name
          );
          const result = await importFiles([file], onDataLoad, finalFolderId);
          if (result) results.push(...result);
        }
      }

      console.log(
        '[handleGlobalFileDrop] Import completed, results:',
        results.length
      );
      return results;
    } catch (error) {
      console.error('[handleGlobalFileDrop] Import failed:', error);
      throw error;
    }
  };

  // Determine if any loading state is active
  const isLoading = isProcessingLocalFile || duckDBLoading;
  const errorMessage = duckDBError;

  // Sidebar animation variants - only for collapse/expand
  const sidebarVariants = {
    expanded: { width: 'var(--sidebar-width)' },
    collapsed: { width: '4rem' },
  };

  // Collapsed sidebar content
  const renderCollapsedContent = () => (
    <>
      <div className="p-4">{/* Header space for collapsed mode */}</div>

      {/* Vertical Toolbar */}
      <div className="mb-12">
        <SidebarToolbar
          collapsed={true}
          onOpenFolder={() => {
            // Handled in SidebarToolbar directly
          }}
          onRemoteClick={() => setIsRemoteModalOpen(true)}
        />
      </div>

      <div className="mt-auto pt-4 p-4 flex flex-col items-center gap-4 border-t border-gray-500/20">
        <div className="flex flex-col gap-2 items-center">
          <Tooltip content={t('sidebar.footer.settings', 'Settings')} placement="right">
            <button
              onClick={handleOpenSettings}
              className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/5 rounded"
              aria-label={t('sidebar.footer.settings', 'Settings')}
            >
              <Settings size={16} />
            </button>
          </Tooltip>
          <a
            href="https://amin.contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-foreground transition-custom p-2 hover:bg-background hover:bg-opacity-30 rounded"
            aria-label={t('sidebar.footer.visitAmin')}
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </>
  );

  // Expanded sidebar content
  const renderExpandedContent = () => (
    <>
      {/* Header with logo and title */}
      <div className="px-5 py-4 border-b border-gray-500/20 bg-black/20 flex items-center justify-between">
        {customLogoUrl ? (
          <img
            src={customLogoUrl}
            className="h-12 w-24 object-contain"
            crossOrigin="anonymous"
          />
        ) : (
          <h1 className="text-white font-heading font-medium text-lg">
            {t('sidebar.header.title')}
          </h1>
        )}
      </div>

      {/* Toolbar */}
      <SidebarToolbar
        collapsed={false}
        onOpenFolder={() => {
          // Handled in SidebarToolbar directly
        }}
        onRemoteClick={() => setIsRemoteModalOpen(true)}
      />

      {/* Folder Tree View - Main content area */}
      <div className="flex-1 overflow-y-auto overflow-x-visible border-t border-gray-500/20">
        <FolderTreeView
          onFileSelect={handleFileSelect}
          onFolderSelect={handleFolderSelect}
        />
      </div>

      {/* Loading status */}
      {isLoading && (
        <div className="mx-5 mb-3 bg-background/30 p-3 border border-white/5 rounded-md">
          <div className="text-xs font-medium text-white text-opacity-80 mb-2 flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse"></div>
            {t('sidebar.processing', 'Processing files...')}
          </div>

          {isLoading && (
            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, duckDBProgress * 100)}%` }}
              ></div>
            </div>
          )}

          {errorMessage && (
            <div className="text-destructive text-xs mt-2 p-2 rounded bg-background/50 border border-destructive/20">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      {/* Footer area - Enhanced */}
      <div className="border-t border-gray-500/20 bg-black/30">
        {/* User Menu - Match Help & Support section styling */}
        <div className="px-3 py-2.5 border-b border-gray-400/15">
          <UserMenu variant="sidebar" />
        </div>
        {/* Action Buttons Section */}
        <div className="px-3 py-2.5 border-b border-gray-400/15 bg-black/20">
          <div className="space-y-0.5">
            {/* DataKit Studio - Standalone */}
            <a
              href="https://datakit.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-2 py-1.5 text-xs hover:bg-white/5 rounded transition-all duration-200 group"
            >
              <svg
                className="h-3.5 w-3.5 text-white/50 group-hover:text-white/70 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span className="font-medium bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                DataKit Studio
              </span>
            </a>

            {/* GitHub Repository */}
            <a
              href="https://github.com/datakitpage/datakit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-white/70 hover:text-white/90 hover:bg-white/5 rounded transition-all duration-200 group"
            >
              <svg className="h-3.5 w-3.5 text-white/50 group-hover:text-white/70 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="font-medium">GitHub Repository</span>
            </a>

            {/* Buy Me a Coffee */}
            <a
              href="https://buymeacoffee.com/aminkhorrami"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-white/70 hover:text-yellow-400 hover:bg-white/5 rounded transition-all duration-200 group"
            >
              <svg className="h-3.5 w-3.5 text-white/50 group-hover:text-yellow-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.168.364z"/>
              </svg>
              <span className="font-medium">Buy Me a Coffee</span>
            </a>

            {/* Help Dropdown */}
            <HelpDropdown />

            {/* Send Feedback - Standalone */}
            <SidebarFeedbackButton context="sidebar" />
          </div>
        </div>

        {/* Attribution footer - Responsive design */}
        <div className="px-2 py-2 border-t border-gray-400/15 bg-black/40">
          <div className="flex items-center justify-between">
            {/* Responsive footer content */}
            <div className="flex-1 min-w-0">
              {/* Wide layout (>250px) - Full text */}
              <div className="hidden xl:block">
                <p className="text-[10px] text-white text-opacity-30 flex items-center flex-wrap">
                  {t('sidebar.footer.poweredBy')}{' '}
                  <a
                    href="https://duckdb.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mx-1"
                  >
                    <img
                      src={DuckDBIcon}
                      className="h-3 w-3 transition-colors hover:opacity-80"
                      alt="DuckDB"
                    />
                  </a>
                  <a
                    href="https://amin.contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('sidebar.footer.built')}
                  </a>
                  {' @ '}
                  <a
                    href="https://www.linkedin.com/company/datakitpage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('sidebar.footer.company')}
                  </a>
                </p>
              </div>

              {/* Compact layout (200-250px) - Stacked text */}
              <div className="block xl:hidden">
                <div className="text-[9px] text-white text-opacity-30 space-y-1">
                  {/* First line: Powered by DuckDB */}
                  <div className="flex items-center">
                    <span>{t('sidebar.footer.poweredBy')}</span>
                    <a
                      href="https://duckdb.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center ml-1"
                    >
                      <img
                        src={DuckDBIcon}
                        className="h-2.5 w-2.5 transition-colors hover:opacity-80"
                        alt="DuckDB"
                      />
                    </a>
                  </div>
                  
                  {/* Second line: Built by links */}
                  <div className="flex items-center gap-1">
                    <a
                      href="https://amin.contact"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {t('sidebar.footer.built')}
                    </a>
                    <span>@</span>
                    <a
                      href="https://www.linkedin.com/company/datakitpage"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {t('sidebar.footer.company')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Settings always on the right */}
            <div className="flex-shrink-0 ml-2">
              <SettingsPopover variant="sidebar" />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <motion.div
        ref={sidebarRef}
        className={`relative bg-darkNav flex flex-col h-full border-r border-gray-500/20 overflow-visible sidebar-container ${
          sidebarCollapsed ? 'sidebar-collapsed' : ''
        }`}
        initial={sidebarCollapsed ? 'collapsed' : 'expanded'}
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {sidebarCollapsed ? renderCollapsedContent() : renderExpandedContent()}

        {/* Resize handle with unique fade-out border */}
        {!sidebarCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize group"
            onMouseDown={handleMouseDown}
          >
            {/* Fade-out border effect with primary gradient */}
            <div
              className={`absolute top-0 right-0 w-1 h-full transition-all duration-150 ease-out ${
                isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'
              }`}
              style={{
                background: isResizing
                  ? 'linear-gradient(to bottom, transparent 0%, hsl(175 100% 36% / 0.6) 10%, hsl(175 100% 45% / 0.7) 30%, hsl(175 100% 55% / 0.5) 50%, hsl(175 100% 45% / 0.7) 70%, hsl(175 100% 36% / 0.6) 90%, transparent 100%)'
                  : 'linear-gradient(to bottom, transparent 0%, hsl(175 100% 36% / 0.7) 15%, hsl(175 100% 45% / 0.5) 35%, hsl(175 100% 55% / 0.4) 50%, hsl(175 100% 45% / 0.5) 65%, hsl(175 100% 36% / 0.7) 85%, transparent 100%)',
              }}
            />

            {/* Subtle glow effect when actively resizing */}
            {isResizing && (
              <>
                <div
                  className="absolute top-0 right-0 w-3 h-full opacity-25 blur-sm transition-all duration-150"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent 0%, hsl(175 100% 36% / 0.3) 15%, hsl(175 100% 45% / 0.25) 40%, hsl(175 100% 55% / 0.15) 50%, hsl(175 100% 45% / 0.25) 60%, hsl(175 100% 36% / 0.3) 85%, transparent 100%)',
                  }}
                />
                <div
                  className="absolute top-0 right-0 w-6 h-full opacity-15 blur-md transition-all duration-150"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent 0%, hsl(175 100% 36% / 0.15) 20%, hsl(175 100% 45% / 0.1) 50%, hsl(175 100% 36% / 0.15) 80%, transparent 100%)',
                  }}
                />
              </>
            )}
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={`absolute top-3 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:border-white/10 transition-colors shadow-lg cursor-pointer rounded-md hover:bg-white/10 ${
            sidebarCollapsed 
              ? 'left-1/2 transform -translate-x-1/2' 
              : 'right-3'
          }`}
          aria-label={
            sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')
          }
        >
          {sidebarCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </motion.div>

      {/* Remote Data Import Modal */}
      <RemoteDataImportModal
        isOpen={isRemoteModalOpen}
        onClose={() => setIsRemoteModalOpen(false)}
        onImport={handleRemoteDataImport}
      />

      {/* Global Drop Zone */}
      <GlobalDropZone
        onFileDrop={handleGlobalFileDrop}
        isProcessing={isLoading}
      />
    </>
  );
};

export default Sidebar;

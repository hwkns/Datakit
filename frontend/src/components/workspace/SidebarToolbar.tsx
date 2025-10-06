import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderPlus,
  FolderOpen,
  Cloud,
  MoreVertical,
  Download,
  Upload,
  FilePlus,
  Info,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFolderStore } from '@/store/folderStore';
import { useFileImport } from '@/hooks/useFileImport';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';

interface SidebarToolbarProps {
  onOpenFolder?: () => void;
  onRemoteClick?: () => void;
  className?: string;
}

export const SidebarToolbar: React.FC<SidebarToolbarProps> = ({
  onOpenFolder,
  onRemoteClick,
  className,
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { createFolder, exportTree, draftFolderId } = useFolderStore();
  const { openFilePicker } = useFileImport();

  const handleNewFolder = () => {
    const folderName = prompt(t('workspace.toolbar.newFolderPrompt', 'Enter folder name:'));
    if (folderName?.trim()) {
      createFolder(folderName.trim(), null);
    }
  };

  const handleOpenFolder = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert(t('workspace.toolbar.browserNotSupported', 'Your browser does not support folder access. Please use Chrome or Edge.'));
      return;
    }

    try {
      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
      });
      
      if (onOpenFolder) {
        onOpenFolder();
      }
      
      // Import the folder structure
      const { linkFolder } = useFolderStore.getState();
      await linkFolder(directoryHandle, null);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error opening folder:', error);
      }
    }
  };

  const handleExportStructure = () => {
    const json = exportTree();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datakit-folder-structure.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportStructure = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const { importTree } = useFolderStore.getState();
        importTree(text);
      }
    };
    input.click();
  };

  const handleFileImport = async () => {
    console.log('[SidebarToolbar.handleFileImport] Using unified file import');
    
    try {
      await openFilePicker(undefined, draftFolderId || undefined, true);
    } catch (error) {
      console.error('[SidebarToolbar.handleFileImport] Error:', error);
    }
  };

  const calculateModalPosition = () => {
    if (helpButtonRef.current) {
      const rect = helpButtonRef.current.getBoundingClientRect();
      const modalWidth = 320; // Approximate modal width
      const spacing = 8; // Gap between button and modal
      
      let left = rect.left + rect.width / 2 - modalWidth / 2;
      let top = rect.bottom + spacing;
      
      // Ensure modal doesn't go off-screen
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Adjust horizontal position if needed
      if (left < 16) left = 16;
      if (left + modalWidth > viewportWidth - 16) {
        left = viewportWidth - modalWidth - 16;
      }
      
      // If modal would go below viewport, show it above the button instead
      if (top + 400 > viewportHeight - 16) { // Approximate modal height
        top = rect.top - 400 - spacing;
      }
      
      setModalPosition({ top, left });
    }
  };

  const handleShowHelp = () => {
    calculateModalPosition();
    setShowHelpModal(true);
  };

  const handleMouseEnter = () => {
    // Clear any existing hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    // Set a small delay before showing to avoid accidental triggers
    hoverTimeoutRef.current = setTimeout(() => {
      calculateModalPosition();
      setShowHelpModal(true);
    }, 300); // 300ms delay
  };

  const handleMouseLeave = () => {
    // Clear the show timeout if user leaves quickly
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Hide with a delay to allow moving to modal
    hideTimeoutRef.current = setTimeout(() => {
      setShowHelpModal(false);
    }, 200); // 200ms delay before hiding
  };

  const handleModalMouseEnter = () => {
    // Cancel hide when hovering over modal
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleModalMouseLeave = () => {
    // Hide immediately when leaving modal
    setShowHelpModal(false);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Help Modal Component
  const HelpModal = () => {
    if (!showHelpModal) return null;

    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none bg-black/20"
        >
          <motion.div
            data-help-modal
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute bg-black backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl p-6 w-80 pointer-events-auto"
            style={{ 
              top: modalPosition.top, 
              left: modalPosition.left,
              transformOrigin: 'top center'
            }}
            onMouseEnter={handleModalMouseEnter}
            onMouseLeave={handleModalMouseLeave}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{t('workspace.toolbar.helpModal.title', 'Workspace Guide')}</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <X size={18} className="text-white/60 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-sm text-white/80">
              <div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FilePlus size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-white">{t('workspace.toolbar.helpModal.importFiles.title', 'Import Files')}</div>
                      <div className="text-white/60 text-xs">{t('workspace.toolbar.helpModal.importFiles.description', 'Add files with persistent access')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FolderPlus size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-white">{t('workspace.toolbar.helpModal.newFolder.title', 'New Folder')}</div>
                      <div className="text-white/60 text-xs">{t('workspace.toolbar.helpModal.newFolder.description', 'Organize your data')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FolderOpen size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-white">{t('workspace.toolbar.helpModal.openFolder.title', 'Open Folder')}</div>
                      <div className="text-white/60 text-xs">{t('workspace.toolbar.helpModal.openFolder.description', 'Import folders from your computer')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Cloud size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-white">{t('workspace.toolbar.helpModal.remoteSources.title', 'Remote Sources')}</div>
                      <div className="text-white/60 text-xs">{t('workspace.toolbar.helpModal.remoteSources.description', 'Connect to databases and cloud storage')}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-white/60 text-xs">
                  <strong>{t('common.labels.tip', 'Tip')}:</strong> {t('workspace.toolbar.helpModal.tip', 'Files location persist between sessions and can be accessed directly from your computer.')}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <div className={cn('flex items-center justify-between px-3 py-2 border-b border-white/10', className)}>
      <div className="flex items-center gap-1">
        {/* Upload Files */}
        <Tooltip  placement='bottom' content={t('workspace.toolbar.uploadFiles', 'Import')}>
          <button
            onClick={handleFileImport}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
            aria-label={t('workspace.toolbar.uploadFiles', 'Import Files')}
          >
            <FilePlus size={18} className="text-white/70 hover:text-white" />
          </button>
        </Tooltip>

        {/* New Folder */}
        <Tooltip placement='bottom' content={t('workspace.toolbar.newFolder', 'New Folder')}>
          <button
            onClick={handleNewFolder}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
            aria-label={t('workspace.toolbar.newFolder', 'New Folder')}
          >
            <FolderPlus size={18} className="text-white/70 hover:text-white" />
          </button>
        </Tooltip>

        {/* Open Folder */}
        <Tooltip  placement='bottom' content={t('workspace.toolbar.openFolder', 'Open Folder')}>
          <button
            onClick={handleOpenFolder}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
            aria-label={t('workspace.toolbar.openFolder', 'Open Folder')}
          >
            <FolderOpen size={18} className="text-white/70 hover:text-white" />
          </button>
        </Tooltip>

        {/* Remote Sources */}
        <Tooltip  placement='bottom' content={t('workspace.toolbar.remoteSources', 'Remote Sources')}>
          <button
            onClick={onRemoteClick}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
            aria-label={t('workspace.toolbar.remoteSources', 'Remote Sources')}
          >
            <Cloud size={18} className="text-white/70 hover:text-white" />
          </button>
        </Tooltip>
      </div>

      {/* Help & More Options */}
      <div className="flex items-center gap-1">
        {/* Help/Info Icon */}
          <button
            ref={helpButtonRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
            aria-label={t('workspace.toolbar.helpTooltip', 'Help - How the workspace works')}
          >
            <Info size={16} className="text-white/50 hover:text-white/70" />
          </button>

        <div className="relative">
          {/* // TODO: We can get back to this in next iterations */}
          {/*  */}
          {/* <Tooltip  placement='left' content={t('workspace.toolbar.moreOptions', 'More Options')}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              aria-label={t('workspace.toolbar.moreOptions', 'More Options')}
            >
              <MoreVertical size={18} className="text-white/70 hover:text-white" />
            </button>
          </Tooltip> */}

        {/* Dropdown Menu */}
        {showMenu && (
          <div
            className="absolute right-0 top-full mt-1 bg-black border border-white/15 rounded-md shadow-xl overflow-hidden z-50 min-w-[160px]"
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              onClick={() => {
                handleExportStructure();
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 w-full text-left text-xs"
            >
              <Download size={14} />
              {t('workspace.toolbar.exportStructure', 'Export Structure')}
            </button>
            <button
              onClick={() => {
                handleImportStructure();
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 w-full text-left text-xs"
            >
              <Upload size={14} />
              {t('workspace.toolbar.importStructure', 'Import Structure')}
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal />
    </div>
  );
};
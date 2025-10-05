import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FolderPlus,
  FolderOpen,
  Cloud,
  MoreVertical,
  Download,
  Upload,
  FilePlus,
} from 'lucide-react';
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

      {/* More Options */}
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
  );
};
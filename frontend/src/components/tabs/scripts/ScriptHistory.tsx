import React, { useState } from 'react';
import {
  History,
  Play,
  Trash2,
  Copy,
  Download,
  Upload,
  Search,
  Calendar,
  FileText,
  MoreVertical,
  Edit3,
  Notebook,
  FilePlus,
} from 'lucide-react';

import { usePythonStore } from '@/store/pythonStore';
import { Button } from '@/components/ui/Button';
import { SaveDialog } from '@/components/ui/SaveDialog';
import type { PythonScript } from '@/lib/python/types';

/**
 * Script history component for managing saved Python scripts
 */
const ScriptHistory: React.FC = () => {
  const {
    savedScripts,
    currentScript,
    cells,
    loadScript,
    deleteScript,
    duplicateScript,
    importScript,
    exportScript,
    createNewScript,
    saveScript,
  } = usePythonStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showNewNotebookConfirm, setShowNewNotebookConfirm] = useState(false);

  // Filter scripts based on search query
  const filteredScripts = savedScripts.filter(
    (script) =>
      script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (script.description &&
        script.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleLoadScript = (script: PythonScript) => {
    loadScript(script.id);
    setShowMenu(null);
  };

  const handleDeleteScript = (scriptId: string) => {
    if (confirm('Are you sure you want to delete this script?')) {
      deleteScript(scriptId);
    }
    setShowMenu(null);
  };

  const handleDuplicateScript = (scriptId: string) => {
    duplicateScript(scriptId);
    setShowMenu(null);
  };

  const handleExportScript = (script: PythonScript) => {
    try {
      const exportData = exportScript(script.id);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${script.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
    setShowMenu(null);
  };

  const handleImportScript = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importScript(file).catch((error) => {
      console.error('Import failed:', error);
      alert('Failed to import script: ' + error.message);
    });

    // Reset file input
    event.target.value = '';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return formatDate(date);
    }
  };

  const startRenaming = (script: PythonScript) => {
    setEditingName(script.id);
    setNewName(script.name);
    setShowMenu(null);
  };

  const saveRename = (scriptId: string) => {
    // Note: This would require adding a rename function to the store
    // For now, we'll just cancel the edit
    setEditingName(null);
    setNewName('');
  };

  const cancelRename = () => {
    setEditingName(null);
    setNewName('');
  };

  const hasUnsavedChanges = () => {
    if (!cells || cells.length === 0) return false;
    
    // Check if this is a new unsaved notebook or has changes
    if (!currentScript) {
      return cells.length > 0 && cells.some(cell => cell.code.trim() !== '');
    }
    
    // Compare current cells with saved script cells
    const currentCellsJson = JSON.stringify(cells);
    const savedCellsJson = JSON.stringify(currentScript.cells);
    return currentCellsJson !== savedCellsJson;
  };

  const handleNewNotebook = () => {
    if (hasUnsavedChanges()) {
      setShowNewNotebookConfirm(true);
    } else {
      createNewScript();
    }
  };

  const handleConfirmNewNotebook = () => {
    setShowNewNotebookConfirm(false);
    createNewScript();
  };

  const handleSaveAndCreateNew = () => {
    setShowNewNotebookConfirm(false);
    if (currentScript) {
      // Save existing script
      saveScript(currentScript.name);
      setTimeout(() => createNewScript(), 100);
    } else {
      // Show save dialog for new script
      setShowSaveDialog(true);
    }
  };

  const handleSaveScript = (name: string) => {
    saveScript(name);
    setShowSaveDialog(false);
    setTimeout(() => createNewScript(), 100);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Notebook className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-white">Notebooks</h3>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            placeholder="Search Notebooks..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-white/10 rounded text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* New Notebook Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewNotebook}
          className="w-full mb-3 h-8 border-white/30 text-white/80 hover:bg-white/10 hover:border-white/30"
          title="Create New Notebook"
        >
          <FilePlus className="w-4 h-4 mr-2" />
          New Notebook
        </Button>

        {/* Import button */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/60">
            {savedScripts.length} saved scripts
          </span>

          <div className="relative">
            <input
              type="file"
              accept=".json,.py"
              onChange={handleImportScript}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Import script"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              title="Import Script"
            >
              <Upload className="w-3 h-3 mr-1" />
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* Script list */}
      <div className="flex-1 overflow-y-auto">
        {filteredScripts.length === 0 ? (
          <div className="p-4 text-center">
            <History className="w-8 h-8 text-white/30 mx-auto mb-2" />
            <p className="text-sm text-white/60">
              {searchQuery ? 'No scripts found' : 'No saved scripts'}
            </p>
            {!searchQuery && (
              <p className="text-xs text-white/40 mt-1">
                Save your first script to see it here
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredScripts.map((script) => (
              <div
                key={script.id}
                className={`relative group rounded-lg p-3 transition-colors ${
                  currentScript?.id === script.id
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
                onClick={() =>
                  setSelectedScript(
                    selectedScript === script.id ? null : script.id
                  )
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingName === script.id ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-1 px-2 py-1 bg-background border border-white/20 rounded text-sm text-white focus:outline-none focus:border-primary/50"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(script.id);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          onBlur={() => cancelRename()}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white text-sm truncate">
                          {script.name}
                        </h4>
                        {currentScript?.id === script.id && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                    )}

                    {script.description && (
                      <p className="text-xs text-white/60 mb-2 line-clamp-2">
                        {script.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatRelativeTime(script.updatedAt)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{script.cells.length} cells</span>
                      </div>

                      {script.cells.some((cell) => cell.executionCount) && (
                        <div className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          <span>Executed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(showMenu === script.id ? null : script.id);
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

                    {/* Dropdown menu */}
                    {showMenu === script.id && (
                      <div className="absolute right-0 top-full mt-1 bg-black border border-white/10 rounded shadow-lg z-20 min-w-40">
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadScript(script);
                          }}
                        >
                          <Play className="w-4 h-4" />
                          Load Script
                        </button>

                        <button
                          className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenaming(script);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                          Rename
                        </button>

                        <button
                          className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateScript(script.id);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>

                        <button
                          className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportScript(script);
                          }}
                        >
                          <Download className="w-4 h-4" />
                          Export
                        </button>

                        <div className="border-t border-white/10" />

                        <button
                          className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteScript(script.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(null)} />
      )}

      {/* New Notebook Confirmation Dialog */}
      {showNewNotebookConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50">
          <div className="bg-darkNav p-6 rounded-lg shadow-lg w-96 max-w-[90vw]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <span className="text-yellow-400 text-sm">!</span>
              </div>
              <h3 className="text-lg font-medium text-white">Unsaved Changes</h3>
            </div>
            
            <p className="text-white/70 mb-6 leading-relaxed">
              You have unsaved changes in your current notebook. What would you like to do?
            </p>
            
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="border border-primary hover:bg-primary/20 justify-center"
                onClick={handleSaveAndCreateNew}
              >
                Save and Create New
              </Button>
              <Button
                variant="outline"
                className="justify-center"
                onClick={handleConfirmNewNotebook}
              >
                Discard Changes
              </Button>
              <Button
                variant="ghost"
                className="justify-center"
                onClick={() => setShowNewNotebookConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      <SaveDialog
        isOpen={showSaveDialog}
        title="Save Notebook"
        placeholder="Enter notebook name"
        onSave={handleSaveScript}
        onClose={() => setShowSaveDialog(false)}
      />
    </div>
  );
};

export default ScriptHistory;

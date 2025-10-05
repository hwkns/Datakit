import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { FolderNode, FolderTreeState, FileData, FileType } from '@/types/folder';

interface FolderStore extends FolderTreeState {
  // State
  draftFolderId: string | null;
  remoteFolderId: string | null;
  
  // Core Actions
  initializeStore: () => void;
  addNode: (node: Omit<FolderNode, 'id' | 'createdAt' | 'modifiedAt'>, parentId?: string) => string;
  removeNode: (nodeId: string) => void;
  moveNode: (nodeId: string, newParentId: string | null) => void;
  renameNode: (nodeId: string, newName: string) => void;
  
  // Folder Actions
  createFolder: (name: string, parentId?: string | null) => string;
  toggleFolder: (folderId: string) => void;
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  linkFolder: (directoryHandle: FileSystemDirectoryHandle, parentId?: string | null) => Promise<void>;
  
  // File Actions
  addFile: (file: File, fileData: FileData, targetFolderId?: string) => string;
  updateFileData: (fileId: string, updates: Partial<FileData>) => void;
  markFileAsLoaded: (fileId: string, tableName: string) => void;
  
  // Selection Actions
  selectNode: (nodeId: string, multi?: boolean) => void;
  clearSelection: () => void;
  
  // Tree Operations
  getNodeById: (nodeId: string) => FolderNode | undefined;
  getChildren: (parentId: string | null) => FolderNode[];
  getParentChain: (nodeId: string) => FolderNode[];
  findNodeByPath: (path: string) => FolderNode | undefined;
  
  // Utility
  exportTree: () => string;
  importTree: (json: string) => void;
  clearAll: () => void;
}

// Helper function to rebuild the tree structure
function rebuildTree(nodeMap: Map<string, FolderNode>): FolderNode[] {
  const roots: FolderNode[] = [];
  
  // Clear existing children arrays
  nodeMap.forEach(node => {
    if (node.type === 'folder') {
      node.children = [];
    }
  });
  
  // Build parent-child relationships
  nodeMap.forEach(node => {
    if (node.parentId === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent && parent.type === 'folder') {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }
    }
  });
  
  // Sort children by type (folders first) then by name
  const sortChildren = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children) {
        sortChildren(node.children);
      }
    });
  };
  
  sortChildren(roots);
  
  return roots;
}

export const useFolderStore = create<FolderStore>()(
  persist(
    (set, get) => ({
      // Initial state
      roots: [],
      nodeMap: new Map(),
      selectedIds: new Set(),
      expandedIds: new Set(),
      draftFolderId: null,
      remoteFolderId: null,
      
      // Initialize store with default folders
      initializeStore: () => {
        const state = get();
        
        // Create Draft folder if it doesn't exist
        if (!state.draftFolderId) {
          const draftId = get().createFolder('Draft', null);
          const draftNode = get().getNodeById(draftId);
          if (draftNode) {
            draftNode.folderData = { ...draftNode.folderData, isDraft: true };
            set({ draftFolderId: draftId });
          }
        }
        
        // Create Remote Sources folder if it doesn't exist
        if (!state.remoteFolderId) {
          const remoteId = get().createFolder('Remote Sources', null);
          const remoteNode = get().getNodeById(remoteId);
          if (remoteNode) {
            remoteNode.folderData = { ...remoteNode.folderData, isRemote: true };
            set({ remoteFolderId: remoteId });
          }
        }
      },
      
      // Add a new node to the tree
      addNode: (nodeData, parentId) => {
        const id = uuidv4();
        const now = Date.now();
        
        const newNode: FolderNode = {
          ...nodeData,
          id,
          parentId: parentId || null,
          createdAt: now,
          modifiedAt: now,
          children: nodeData.type === 'folder' ? [] : undefined,
        };
        
        const nodeMap = new Map(get().nodeMap);
        nodeMap.set(id, newNode);
        
        const roots = rebuildTree(nodeMap);
        set({ nodeMap, roots });
        
        return id;
      },
      
      // Remove a node and all its children
      removeNode: (nodeId) => {
        const nodeMap = new Map(get().nodeMap);
        const selectedIds = new Set(get().selectedIds);
        const expandedIds = new Set(get().expandedIds);
        
        const removeRecursive = (id: string) => {
          const node = nodeMap.get(id);
          if (!node) return;
          
          // Remove children first
          if (node.children) {
            node.children.forEach(child => removeRecursive(child.id));
          }
          
          // Remove from collections
          nodeMap.delete(id);
          selectedIds.delete(id);
          expandedIds.delete(id);
        };
        
        removeRecursive(nodeId);
        
        const roots = rebuildTree(nodeMap);
        set({ nodeMap, roots, selectedIds, expandedIds });
      },
      
      // Move a node to a new parent
      moveNode: (nodeId, newParentId) => {
        const nodeMap = new Map(get().nodeMap);
        const node = nodeMap.get(nodeId);
        
        if (!node) return;
        
        // Prevent moving into self or descendants
        if (newParentId) {
          let parent = nodeMap.get(newParentId);
          while (parent) {
            if (parent.id === nodeId) return;
            parent = parent.parentId ? nodeMap.get(parent.parentId) : undefined;
          }
        }
        
        node.parentId = newParentId;
        node.modifiedAt = Date.now();
        
        const roots = rebuildTree(nodeMap);
        set({ nodeMap, roots });
      },
      
      // Rename a node
      renameNode: (nodeId, newName) => {
        const nodeMap = new Map(get().nodeMap);
        const node = nodeMap.get(nodeId);
        
        if (node) {
          const oldName = node.name;
          node.name = newName;
          node.modifiedAt = Date.now();
          
          // If this is a file node, also update the corresponding workspace file and open tabs
          if (node.type === 'file') {
            // Import appStore dynamically to avoid circular dependency
            import('@/store/appStore').then(({ useAppStore }) => {
              const { workspaceFiles, updateWorkspaceFile, files, updateFile } = useAppStore.getState();
              const workspaceFile = workspaceFiles.find(f => f.name === oldName);
              
              if (workspaceFile) {
                console.log('[FolderStore] Updating workspace file name from', oldName, 'to', newName);
                // Update display name but preserve originalName for handle verification
                const updates: any = { name: newName };
                if (!workspaceFile.originalName) {
                  updates.originalName = oldName; // Set originalName if not already set
                }
                updateWorkspaceFile(workspaceFile.id, updates);
                
                // Also update any open file tab with the same name
                const openFile = files.find(f => f.fileName === oldName);
                if (openFile) {
                  console.log('[FolderStore] Updating open file tab name from', oldName, 'to', newName);
                  updateFile(openFile.id, { fileName: newName });
                }
              }
            }).catch(console.error);
          }
          
          const roots = rebuildTree(nodeMap);
          set({ nodeMap, roots });
        }
      },
      
      // Create a new folder
      createFolder: (name, parentId = null) => {
        return get().addNode({
          name,
          type: 'folder',
          folderData: {},
        }, parentId);
      },
      
      // Toggle folder expanded state
      toggleFolder: (folderId) => {
        const expandedIds = new Set(get().expandedIds);
        if (expandedIds.has(folderId)) {
          expandedIds.delete(folderId);
        } else {
          expandedIds.add(folderId);
        }
        set({ expandedIds });
      },
      
      // Expand a folder
      expandFolder: (folderId) => {
        const expandedIds = new Set(get().expandedIds);
        expandedIds.add(folderId);
        set({ expandedIds });
      },
      
      // Collapse a folder
      collapseFolder: (folderId) => {
        const expandedIds = new Set(get().expandedIds);
        expandedIds.delete(folderId);
        set({ expandedIds });
      },
      
      // Link a folder from the file system
      linkFolder: async (directoryHandle, parentId = null) => {
        const folderId = get().createFolder(directoryHandle.name, parentId);
        const node = get().getNodeById(folderId);
        
        if (node) {
          node.folderData = {
            ...node.folderData,
            isLinked: true,
            directoryHandle,
          };
          
          // Scan directory and add files
          try {
            for await (const entry of directoryHandle.values()) {
              if (entry.kind === 'file') {
                const file = await entry.getFile();
                const fileExt = file.name.split('.').pop()?.toLowerCase();
                
                // Only add supported file types
                const supportedExtensions = ['csv', 'json', 'xlsx', 'xls', 'parquet', 'txt', 'duckdb', 'db'];
                if (fileExt && supportedExtensions.includes(fileExt)) {
                  // Add to folder store
                  get().addFile(file, {
                    handle: entry,
                    size: file.size,
                    lastModified: file.lastModified,
                    fileType: fileExt as FileType,
                    isLoaded: false,
                  }, folderId);
                  
                  // Also add to workspace files for persistence
                  const { useAppStore } = await import('@/store/appStore');
                  const { addFileToWorkspace } = useAppStore.getState();
                  const workspaceFile = {
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    originalName: file.name, // Store original name for handle verification
                    type: (fileExt === 'xlsx' || fileExt === 'xls' ? 'excel' : fileExt) as any,
                    size: file.size,
                    lastModified: file.lastModified,
                    handle: entry,
                  };
                  addFileToWorkspace(workspaceFile);
                }
              } else if (entry.kind === 'directory') {
                // Recursively add subdirectories (up to 3 levels)
                const depth = get().getParentChain(folderId).length;
                if (depth < 3) {
                  await get().linkFolder(entry, folderId);
                }
              }
            }
          } catch (error) {
            console.error('Error scanning directory:', error);
          }
        }
      },
      
      // Add a file to the tree
      addFile: (file, fileData, targetFolderId) => {
        const state = get();
        let folderId = targetFolderId || state.draftFolderId;
        
        console.log('[FolderStore.addFile] Adding file:', file.name, 'targetFolderId:', targetFolderId, 'draftFolderId:', state.draftFolderId, 'finalFolderId:', folderId);
        
        // Ensure Draft folder exists if no target specified
        if (!folderId) {
          console.log('[FolderStore.addFile] No folder ID, initializing store');
          if (!state.draftFolderId) {
            get().initializeStore();
          }
          folderId = get().draftFolderId;
          console.log('[FolderStore.addFile] After initialization, draftFolderId:', folderId);
        }
        
        const nodeId = get().addNode({
          name: file.name,
          type: 'file',
          fileData: {
            ...fileData,
            size: file.size,
            lastModified: file.lastModified,
          },
        }, folderId);
        
        console.log('[FolderStore.addFile] Added file node with ID:', nodeId, 'to folder:', folderId);
        return nodeId;
      },
      
      // Update file data
      updateFileData: (fileId, updates) => {
        const nodeMap = new Map(get().nodeMap);
        const node = nodeMap.get(fileId);
        
        if (node && node.type === 'file') {
          node.fileData = { ...node.fileData, ...updates };
          node.modifiedAt = Date.now();
          
          const roots = rebuildTree(nodeMap);
          set({ nodeMap, roots });
        }
      },
      
      // Mark file as loaded in DuckDB
      markFileAsLoaded: (fileId, tableName) => {
        get().updateFileData(fileId, {
          isLoaded: true,
          tableName,
        });
      },
      
      // Select a node
      selectNode: (nodeId, multi = false) => {
        const selectedIds = new Set(multi ? get().selectedIds : []);
        selectedIds.add(nodeId);
        set({ selectedIds });
      },
      
      // Clear selection
      clearSelection: () => {
        set({ selectedIds: new Set() });
      },
      
      // Get node by ID
      getNodeById: (nodeId) => {
        return get().nodeMap.get(nodeId);
      },
      
      // Get children of a node
      getChildren: (parentId) => {
        if (parentId === null) {
          return get().roots;
        }
        const parent = get().nodeMap.get(parentId);
        return parent?.children || [];
      },
      
      // Get parent chain (breadcrumb)
      getParentChain: (nodeId) => {
        const chain: FolderNode[] = [];
        let current = get().nodeMap.get(nodeId);
        
        while (current && current.parentId) {
          const parent = get().nodeMap.get(current.parentId);
          if (parent) {
            chain.unshift(parent);
            current = parent;
          } else {
            break;
          }
        }
        
        return chain;
      },
      
      // Find node by path (e.g., "Draft/Sales/2024")
      findNodeByPath: (path) => {
        const parts = path.split('/').filter(p => p);
        let current = get().roots;
        let found: FolderNode | undefined;
        
        for (const part of parts) {
          found = current.find(n => n.name === part);
          if (!found) return undefined;
          if (found.type === 'folder' && found.children) {
            current = found.children;
          }
        }
        
        return found;
      },
      
      // Export tree as JSON
      exportTree: () => {
        const state = get();
        return JSON.stringify({
          roots: state.roots,
          nodeMap: Array.from(state.nodeMap.entries()),
          draftFolderId: state.draftFolderId,
          remoteFolderId: state.remoteFolderId,
        }, null, 2);
      },
      
      // Import tree from JSON
      importTree: (json) => {
        try {
          const data = JSON.parse(json);
          const nodeMap = new Map(data.nodeMap);
          const roots = rebuildTree(nodeMap);
          
          set({
            roots,
            nodeMap,
            draftFolderId: data.draftFolderId,
            remoteFolderId: data.remoteFolderId,
            selectedIds: new Set(),
            expandedIds: new Set(),
          });
        } catch (error) {
          console.error('Error importing tree:', error);
        }
      },
      
      // Clear all data
      clearAll: () => {
        set({
          roots: [],
          nodeMap: new Map(),
          selectedIds: new Set(),
          expandedIds: new Set(),
          draftFolderId: null,
          remoteFolderId: null,
        });
      },
    }),
    {
      name: 'folder-tree-storage',
      partialize: (state) => ({
        roots: state.roots,
        nodeMap: Array.from(state.nodeMap.entries()),
        expandedIds: Array.from(state.expandedIds),
        draftFolderId: state.draftFolderId,
        remoteFolderId: state.remoteFolderId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore Map and Set objects
          state.nodeMap = new Map(state.nodeMap as any);
          state.expandedIds = new Set(state.expandedIds as any);
          state.selectedIds = new Set();
          
          // Initialize default folders
          state.initializeStore();
        }
      },
    }
  )
);
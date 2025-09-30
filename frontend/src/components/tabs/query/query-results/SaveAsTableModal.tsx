import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SaveAsTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tableName: string) => void;
  isImporting: boolean;
  rowCount: number;
  columnCount: number;
  sourceFileName?: string;
}

const SaveAsTableModal: React.FC<SaveAsTableModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isImporting,
  rowCount,
  columnCount,
  sourceFileName
}) => {
  const [tableName, setTableName] = useState('');
  const [error, setError] = useState('');

  // Generate suggested name when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 4);
      
      if (sourceFileName) {
        const baseName = sourceFileName
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .toLowerCase();
        setTableName(`${baseName}_${dateStr}_${timeStr}`);
      } else {
        setTableName(`results_${dateStr}_${timeStr}`);
      }
      setError('');
    }
  }, [isOpen, sourceFileName]);

  const validateTableName = (name: string): boolean => {
    if (!name.trim()) {
      setError('Table name is required');
      return false;
    }
    
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      setError('Table name must start with a letter or underscore and contain only letters, numbers, and underscores');
      return false;
    }
    
    if (name.length > 63) {
      setError('Table name must be 63 characters or less');
      return false;
    }
    
    const reservedWords = ['select', 'from', 'where', 'table', 'view', 'create', 'drop', 'insert', 'update', 'delete'];
    if (reservedWords.includes(name.toLowerCase())) {
      setError('Table name cannot be a reserved SQL keyword');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleConfirm = () => {
    if (validateTableName(tableName)) {
      onConfirm(tableName);
    }
  };

  const handleTableNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTableName(value);
    validateTableName(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          {/* Modal */}
          <motion.div 
            className="relative bg-black border border-white/10 rounded-lg shadow-2xl w-full max-w-lg mx-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.3
            }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Save Results</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            disabled={isImporting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Info Box */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">How it works:</p>
                <ul className="space-y-1 text-white/80">
                  <li>• The table will appear as a new tab for easy access</li>
                  <li>• You can query this table directly using SQL</li>
                  <li>• This table exists only in your browser - download the file to save permanently</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Dataset Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/60 mb-1">Rows</div>
              <div className="font-semibold">{rowCount.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/60 mb-1">Columns</div>
              <div className="font-semibold">{columnCount}</div>
            </div>
          </div>

          {/* Table Name Input */}
          <div className="space-y-2">
            <label htmlFor="tableName" className="block text-sm font-medium">
              Table Name
            </label>
            <input
              id="tableName"
              type="text"
              value={tableName}
              onChange={handleTableNameChange}
              className="w-full px-3 py-2 bg-background border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter table name"
              disabled={isImporting}
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <p className="text-xs text-white/60">
              Choose a descriptive name for your table. Only letters, numbers, and underscores are allowed.
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleConfirm}
            disabled={isImporting || !tableName.trim() || !!error}
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                Create Table
              </>
            )}
          </Button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SaveAsTableModal;
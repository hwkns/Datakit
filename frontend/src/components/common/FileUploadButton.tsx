import * as React from "react";
import { useState, useRef } from "react";
import { Upload, File as FileIcon } from "lucide-react";

import { CSVIcon } from "@/components/icons/CSVIcon";
import { Button } from "@/components/ui/Button";

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  accept?: string;
  className?: string;
  supportLargeFiles?: boolean;
}

export const FileUploadButton = ({
  onFileSelect,
  isLoading = false,
  accept = ".csv,.json",
  className = "",
  supportLargeFiles = true,
}: FileUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleButtonClick = async () => {
    // Try to use File System Access API for better large file handling if supported
    if (supportLargeFiles && 'showOpenFilePicker' in window) {
      try {
        // Configure the file picker
        const pickerOpts = {
          types: [
            {
              description: 'Data Files',
              accept: {
                'text/csv': ['.csv'],
                'application/json': ['.json']
              }
            }
          ],
          excludeAcceptAllOption: false,
          multiple: false
        };

        // Show the file picker
        const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
        const file = await fileHandle.getFile();
        
        // Store the file handle in a data attribute for potential future access
        (file as any)._handle = fileHandle;
        
        onFileSelect(file);
      } catch (err) {
        // User cancelled or API failed, fall back to regular file input
        // Don't show error for AbortError (user cancelled dialog)
        if (!(err instanceof Error) || err.name !== 'AbortError') {
          console.warn('File System Access API failed, falling back to regular input:', err);
          fileInputRef.current?.click();
        }
      }
    } else {
      // Fall back to regular file input for browsers without File System Access API
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Get the dropped file
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Check if the file type is accepted
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (fileExt === 'csv' || fileExt === 'json') {
        onFileSelect(file);
      } else {
        alert('Please upload a CSV or JSON file');
      }
    }
  };

  return (
    <div 
      className={`relative ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Render different UI based on drag state and loading */}
      {isDragging ? (
        <div className="border-2 border-dashed border-primary rounded-lg p-6 flex flex-col items-center justify-center transition-colors bg-primary/10">
          <FileIcon className="h-10 w-10 text-primary mb-2" />
          <p className="text-primary font-medium">Drop your file here</p>
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            className={`w-full bg-transparent border-primary text-foreground hover:bg-primary/10 hover:text-primary transition-colors ${className}`}
            onClick={handleButtonClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent mr-2" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CSVIcon size={16} className="mr-2" />
                <span>Upload CSV, JSON</span>
              </>
            )}
          </Button>
          <div className="mt-1 text-xs text-center text-white text-opacity-60">
            {supportLargeFiles && 'showOpenFilePicker' in window ? 
              'Supports files up to 5GB' : 
              'Supports files up to 2GB'}
          </div>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
        disabled={isLoading}
      />
    </div>
  );
};
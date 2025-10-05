import { useRef } from "react";
import { useFileImport } from "@/hooks/useFileImport";

export const useFileUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openFilePicker, importFiles, isProcessing } = useFileImport();

  const handleButtonClick = async () => {
    console.log('[useFileUpload] Using unified import via openFilePicker');
    try {
      await openFilePicker(undefined, undefined, false); // single file for compatibility
    } catch (error) {
      console.error('[useFileUpload] Error:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    console.log('[useFileUpload] Using unified import for file input:', files.length, 'files');
    
    try {
      await importFiles(files);
    } catch (error) {
      console.error('[useFileUpload] Error importing files:', error);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    fileInputRef,
    handleButtonClick,
    handleFileSelect,
    isProcessing,
  };
};
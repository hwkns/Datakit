import { useRef } from "react";
import useDirectFileImport from "@/hooks/useDirectFileImport";
import { useAppStore } from "@/store/appStore";
import { useAnalytics } from "@/hooks/useAnalytics";

export const useFileUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analytics = useAnalytics();
  const { addFile } = useAppStore();
  const { processFile, processFileStreaming, isProcessing } = useDirectFileImport();

  const handleButtonClick = async () => {
    // Try to use File System Access API for better performance
    if ("showOpenFilePicker" in window) {
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [
            {
              description: "Data Files",
              accept: {
                "text/csv": [".csv"],
                "application/json": [".json"],
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
                "application/vnd.ms-excel": [".xls"],
                "application/x-parquet": [".parquet"],
                "application/octet-stream": [".duckdb"],
              },
            },
          ],
          multiple: false,
        });

        const file = await fileHandle.getFile();
        
        // Use streaming for better performance
        await processFileStreaming(fileHandle, file, (result) => {
          addFile(result);
          analytics.trackFileUpload(result);
        });
      } catch (err) {
        if (!(err instanceof Error) || err.name !== "AbortError") {
          // Fall back to regular input if API fails
          fileInputRef.current?.click();
        }
      }
    } else {
      // Fall back to regular input
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file, (result) => {
      addFile(result);
      analytics.trackFileUpload(result);
    });
    
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
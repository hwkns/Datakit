import { useState, useCallback } from "react";

import { DataLoadWithDuckDBResult } from "@/components/layout/Sidebar";

import { useDuckDBStore } from "@/store/duckDBStore";

import DataProcessingUtil from "@/lib/data/dataProcessingUtil";
import { convertDuckDBColumnTypes } from "@/lib/duckdb/ingestion/convertDuckDBColumnTypes";

/**
 * URL validation result interface
 */
interface URLValidation {
  isValid: boolean;
  error?: string;
  detectedFormat?: string;
  source?: string;
  filename?: string;
  extension?: string;
}

/**
 * URL validation result interface
 */
interface URLValidation {
  isValid: boolean;
  error?: string;
  detectedFormat?: string;
  source?: string;
  filename?: string;
  extension?: string;
}

/**
 * Hook for importing data from custom URLs
 */
export default function useCustomURLImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);


  const {
    importFileDirectly,
    executeQuery,
  } = useDuckDBStore();


  const createSampleData = useCallback(
    (schemaResult: any, sampleResult: any): string[][] => {
      const headers = schemaResult.toArray().map((col: any) => col.name);
      const sampleData = [
        headers,
        ...sampleResult.toArray().map((row: any) =>
          headers.map((col: string) => {
            if (row[col] === null || row[col] === undefined) return "";
            return String(row[col]);
          })
        ),
      ];
      return sampleData;
    },
    []
  );

  /**
   * Validate URL and detect format/source
   */
  const validateURL = useCallback((url: string): URLValidation => {
    try {
      // Basic URL validation
      const urlObj = new URL(url);
      
      // Get filename and extension
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || '';
      const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : '';
      
      // Check if URL is accessible (basic validation)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          isValid: false,
          error: "URL must use HTTP or HTTPS protocol"
        };
      }

      // Detect source
      let source = "direct";
      if (urlObj.hostname.includes("github.com") || urlObj.hostname.includes("githubusercontent.com")) {
        source = "github";
      } else if (urlObj.hostname.includes("amazonaws.com") || urlObj.hostname.includes("s3")) {
        source = "aws";
      } else if (urlObj.hostname.includes("googleapis.com") || urlObj.hostname.includes("gcs")) {
        source = "gcs";
      }

      // Detect format from extension
      let detectedFormat: string | undefined;
      const supportedFormats = {
        'csv': 'csv',
        'tsv': 'tsv', 
        'json': 'json',
        'jsonl': 'jsonl',
        'ndjson': 'jsonl',
        'parquet': 'parquet',
        'xlsx': 'excel',
        'xls': 'excel',
        'txt': 'text',
        'gz': 'compressed' // Could be csv.gz, json.gz, etc.
      };

      if (extension && supportedFormats[extension]) {
        detectedFormat = supportedFormats[extension];
        
        // Handle compressed files - try to detect inner format
        if (extension === 'gz') {
          const innerExtension = filename.split('.').slice(-2, -1)[0]?.toLowerCase();
          if (innerExtension && supportedFormats[innerExtension]) {
            detectedFormat = supportedFormats[innerExtension];
          }
        }
      }

      // Special validation for GitHub raw URLs
      if (source === "github" && !urlObj.hostname.includes("raw.githubusercontent.com")) {
        // Check if it's a github.com URL that should be converted to raw
        if (urlObj.hostname === "github.com" && urlObj.pathname.includes("/blob/")) {
          return {
            isValid: false,
            error: "Please use GitHub raw URL (raw.githubusercontent.com) instead of blob URL"
          };
        }
      }

      // Warn about potential CORS issues
      let corsWarning = "";
      if (source === "direct" && !urlObj.hostname.includes("cors") && !urlObj.hostname.includes("api")) {
        corsWarning = "Direct URLs may have CORS restrictions";
      }

      return {
        isValid: true,
        detectedFormat,
        source,
        filename,
        extension,
        error: corsWarning || undefined
      };

    } catch (err) {
      return {
        isValid: false,
        error: "Invalid URL format"
      };
    }
  }, []);

  /**
   * Import data from custom URL - follows same ideology as processFile
   */
  const importFromURL = useCallback(async (url: string, customName?: string): Promise<DataLoadWithDuckDBResult> => {
    try {
      setIsImporting(true);
      setError(null);
      setImportProgress(0);
      setImportStatus("Validating URL...");

      // Validate URL first
      const validation = validateURL(url);
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid URL");
      }

      const filename = validation.filename || 'unknown_file';
      const datasetName = customName || filename;

      setImportProgress(0.1);
      setImportStatus("Checking file accessibility...");

      // Try to fetch file headers to check if accessible and get size
      let contentLength: number | null = null;
      try {
        const headResponse = await fetch(url, { method: 'HEAD' });
        if (headResponse.ok) {
          const contentLengthHeader = headResponse.headers.get('content-length');
          contentLength = contentLengthHeader ? parseInt(contentLengthHeader) : null;
          
          // Check if file is too large for browser processing
          if (contentLength && DataProcessingUtil.isFileTooLarge(contentLength)) {
            throw new Error(
              `File is too large (${DataProcessingUtil.formatFileSize(contentLength)}). ` +
              `Maximum supported size is 2GB for browser processing.`
            );
          }
        }
      } catch (headError) {
        console.warn('HEAD request failed, proceeding with GET request');
      }

      setImportProgress(0.2);
      
      // Show appropriate status based on file size
      if (contentLength) {
        const sizeCategory = DataProcessingUtil.getFileSizeCategory(contentLength);
        const formattedSize = DataProcessingUtil.formatFileSize(contentLength);
        if (sizeCategory === 'large' || sizeCategory === 'huge') {
          setImportStatus(`Downloading large file (${formattedSize})...`);
        } else {
          setImportStatus(`Downloading file (${formattedSize})...`);
        }
      } else {
        setImportStatus("Downloading file...");
      }

      // Get the actual file content
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }

      setImportProgress(0.4);
      setImportStatus("Creating virtual file...");

      // Get content type and actual size
      const contentType = response.headers.get('content-type') || '';
      const actualContentLength = response.headers.get('content-length');
      const fileSize = actualContentLength ? parseInt(actualContentLength) : null;

      // Create a File object from the downloaded content (same as processFile expects)
      const blob = await response.blob();
      const virtualFile = new File([blob], filename, { 
        type: contentType || 'application/octet-stream',
        lastModified: Date.now() 
      });

      setImportProgress(0.5);
      setImportStatus("Processing file with DuckDB...");

      // Use DataProcessingUtil for validation (same as processFile)
      const fileValidation = DataProcessingUtil.validateFile(virtualFile.name, virtualFile.size);
      const formattedSize = DataProcessingUtil.formatFileSize(virtualFile.size);
      const sourceType = DataProcessingUtil.detectSourceType(virtualFile.name);

      // Show validation warnings
      if (fileValidation.warnings.length > 0) {
        console.warn(`[CustomURL] File warnings:`, fileValidation.warnings);
      }

      console.log(`[CustomURL] Processing: ${filename} (${formattedSize})`);

      // Import using DuckDB (same as processFile)
      const importResult = await importFileDirectly(virtualFile);

      setImportProgress(0.8);
      setImportStatus("Fetching schema and sample data...");

      // Get schema and sample data (same as processFile)
      const schemaResult = await executeQuery(
        `PRAGMA table_info("${importResult.tableName}")`
      );
      if (!schemaResult) {
        throw new Error("Failed to get table schema");
      }

      const sampleResult = await executeQuery(
        `SELECT * FROM "${importResult.tableName}" LIMIT 1000`
      );
      if (!sampleResult) {
        throw new Error("Failed to get data sample");
      }

      setImportProgress(0.9);
      setImportStatus("Finalizing import...");


      const sampleData = createSampleData(schemaResult, sampleResult);
      const columnTypes = convertDuckDBColumnTypes(schemaResult);
      const headers = schemaResult.toArray().map((col: any) => col.name);

      // Create final result (same structure as processFile)
      const result: DataLoadWithDuckDBResult = {
        data: sampleData,
        columnTypes,
        fileName: datasetName,
        rowCount: importResult.rowCount,
        columnCount: headers.length,
        sourceType,
        loadedToDuckDB: true, // URL data IS loaded to DuckDB (same as processFile)
        tableName: importResult.tableName,
        isRemote: true,
        remoteURL: url,
        remoteProvider: 'custom-url',
        rawData: blob, // Store the blob as raw data
      };

      setImportProgress(1);
      setImportStatus("Import completed successfully!");


      // Reset state after successful import
      setTimeout(() => {
        setIsImporting(false);
        setImportStatus("");
        setImportProgress(0);
      }, 1000);

      return result;

    } catch (err) {
      console.error("[CustomURL] Import failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to import from URL";
      setError(errorMessage);
      setImportStatus(`Import failed: ${errorMessage}`);
      
      // Reset importing state but keep error visible
      setTimeout(() => {
        setIsImporting(false);
      }, 1000);
      
      throw err;
    }
  }, [validateURL, importFileDirectly, executeQuery]);

  /**
   * Test URL accessibility without importing
   */
  const testURL = useCallback(async (url: string) => {
    try {
      const validation = validateURL(url);
      if (!validation.isValid) {
        return { accessible: false, error: validation.error };
      }

      // Try HEAD request first (faster)
      const response = await fetch(url, { method: 'HEAD' });
      
      return {
        accessible: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (err) {
      return {
        accessible: false,
        error: err instanceof Error ? err.message : "Network error"
      };
    }
  }, [validateURL]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsImporting(false);
    setImportStatus("");
    setImportProgress(0);
    setError(null);
  }, []);

  return {
    // State
    isImporting,
    importStatus,
    importProgress,
    error,

    // Actions
    importFromURL,
    validateURL,
    testURL,
    clearError,
    reset,

    // Computed
    isIdle: !isImporting && !error && importProgress === 0,
    isComplete: !isImporting && importProgress === 1,
  };
}
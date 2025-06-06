import { useState, useCallback } from "react";
import { useDuckDBStore } from "@/store/duckDBStore";
import { ColumnType } from "@/types/csv";
import { DataSourceType } from "@/types/json";

/**
 * Result type from HuggingFace dataset import
 */
export interface HFImportResult {
  data: string[][];
  columnTypes: ColumnType[];
  fileName: string;
  rowCount: number;
  columnCount: number;
  sourceType: DataSourceType;
  loadedToDuckDB: boolean;
  tableName: string;
  huggingface: {
    datasetId: string;
    config?: string;
    split?: string;
    parquetUrl: string;
    fileSize?: number;
    method: 'direct' | 'proxy' | 'failed';
    metadata?: any;
  };
}

/**
 * Dataset ID validation result
 */
export interface DatasetIdValidation {
  isValid: boolean;
  organization?: string;
  dataset?: string;
  error?: string;
}

/**
 * Import options
 */
export interface HFImportOptions {
  authToken?: string;
  config?: string;
  split?: string;
  subset?: string;
}

/**
 * HuggingFace API endpoints
 */
const HF_API_BASE = "https://datasets-server.huggingface.co";
const HF_HUB_API = "https://huggingface.co/api/datasets";

/**
 * CORS proxy options for datasets that don't support direct browser access
 */
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

/**
 * Utility function to get data source type (always Parquet for HF)
 */
const getDataSourceTypeFromExtension = (): DataSourceType => {
  return DataSourceType.PARQUET;
};

/**
 * Hook for importing datasets from HuggingFace Hub
 */
export default function useHuggingFaceImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const duckDB = useDuckDBStore();

  /**
   * Parse dataset ID and extract components
   */
  const parseDatasetId = useCallback((datasetId: string): DatasetIdValidation => {
    try {
      const trimmed = datasetId.trim();
      
      if (!trimmed) {
        return {
          isValid: false,
          error: "Dataset ID cannot be empty"
        };
      }

      // Remove any URL prefix if user pasted full URL
      let cleanId = trimmed;
      if (cleanId.includes('huggingface.co/datasets/')) {
        cleanId = cleanId.split('huggingface.co/datasets/')[1];
      }
      
      // Remove any trailing slashes or query params
      cleanId = cleanId.split('?')[0].replace(/\/$/, '');

      // Validate format: organization/dataset-name
      const parts = cleanId.split('/');
      if (parts.length !== 2) {
        return {
          isValid: false,
          error: "Dataset ID must be in format: organization/dataset-name"
        };
      }

      const [organization, dataset] = parts;

      if (!organization || !dataset) {
        return {
          isValid: false,
          error: "Both organization and dataset name are required"
        };
      }

      // Basic validation for valid characters
      const validPattern = /^[a-zA-Z0-9._-]+$/;
      if (!validPattern.test(organization) || !validPattern.test(dataset)) {
        return {
          isValid: false,
          error: "Dataset ID contains invalid characters. Use only letters, numbers, dots, hyphens, and underscores"
        };
      }

      return {
        isValid: true,
        organization,
        dataset
      };

    } catch (err) {
      return {
        isValid: false,
        error: `Invalid dataset ID format: ${err instanceof Error ? err.message : 'Unknown error'}`
      };
    }
  }, []);

  /**
   * Get dataset information from HuggingFace API
   */
  const getDatasetInfo = useCallback(
    async (datasetId: string, authToken?: string): Promise<any> => {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${HF_HUB_API}/${datasetId}`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please provide a valid HuggingFace token.");
        } else if (response.status === 403) {
          throw new Error("Access denied. You may need authentication or the dataset may be private.");
        } else if (response.status === 404) {
          throw new Error("Dataset not found. Please check the dataset ID.");
        } else {
          throw new Error(`Failed to fetch dataset info: ${response.status} ${response.statusText}`);
        }
      }

      return await response.json();
    },
    []
  );

  /**
   * Get parquet files for a dataset
   */
  const getParquetFiles = useCallback(
    async (datasetId: string, config: string = "default", authToken?: string): Promise<any> => {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const url = `${HF_API_BASE}/parquet?dataset=${datasetId}&config=${config}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required for this dataset.");
        } else if (response.status === 404) {
          throw new Error("No parquet files found for this dataset configuration.");
        } else {
          throw new Error(`Failed to fetch parquet files: ${response.status} ${response.statusText}`);
        }
      }

      return await response.json();
    },
    []
  );

  /**
   * Test CORS access to a URL
   */
  const testCORSAccess = useCallback(async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        mode: "cors",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (err) {
      return false;
    }
  }, []);

  /**
   * Try to fetch file with CORS proxy fallbacks
   */
  const fetchWithCORSFallback = useCallback(
    async (
      originalUrl: string,
      fileName: string,
      onProgress?: (loaded: number, total?: number) => void
    ): Promise<{ blob: Blob; method: 'direct' | 'proxy'; fileSize: number }> => {

      // First, try direct access
      setImportStatus(`Testing direct access to ${fileName}...`);
      const hasDirectCORS = await testCORSAccess(originalUrl);

      if (hasDirectCORS) {
        setImportStatus(`Direct access available for ${fileName}`);
        const result = await fetchDirectly(originalUrl, onProgress);
        return { ...result, method: 'direct' };
      }

      // Try CORS proxies
      setImportStatus(`Direct access blocked, trying CORS proxies for ${fileName}...`);

      for (let i = 0; i < CORS_PROXIES.length; i++) {
        const proxyUrl = CORS_PROXIES[i] + encodeURIComponent(originalUrl);

        try {
          setImportStatus(`Trying CORS proxy ${i + 1}/${CORS_PROXIES.length} for ${fileName}...`);

          const response = await fetch(proxyUrl, { mode: 'cors' });
          if (response.ok) {
            const blob = await response.blob();
            const fileSize = blob.size;
            
            setImportStatus(`Successfully downloaded ${fileName} via proxy`);
            return { blob, method: 'proxy', fileSize };
          }
        } catch (err) {
          console.warn(`CORS proxy ${i + 1} failed:`, err);
        }
      }

      throw new Error(
        `Cannot access HuggingFace file due to CORS restrictions. This dataset may require authentication or may not be publicly accessible.`
      );
    },
    [testCORSAccess]
  );

  /**
   * Direct fetch implementation
   */
  const fetchDirectly = useCallback(
    async (
      url: string,
      onProgress?: (loaded: number, total?: number) => void
    ): Promise<{ blob: Blob; fileSize: number }> => {
      
      // Get file size if possible
      const headResponse = await fetch(url, {
        method: "HEAD",
        mode: "cors",
      }).catch(() => null);

      const contentLength = headResponse?.headers.get("content-length");
      const fileSize = contentLength ? parseInt(contentLength, 10) : 0;

      setImportStatus(`Downloading parquet file${fileSize ? ` (${(fileSize / 1024 / 1024).toFixed(1)}MB)` : ''}...`);

      // Fetch the actual file
      const response = await fetch(url, { mode: "cors" });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. This dataset may require authentication or may be private.");
        } else if (response.status === 404) {
          throw new Error("Parquet file not found.");
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // Process response with progress tracking
      const reader = response.body?.getReader();
      if (!reader) {
        const blob = await response.blob();
        return { blob, fileSize: blob.size };
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (onProgress) {
          onProgress(receivedLength, fileSize || undefined);
        }

        if (fileSize > 0) {
          const progress = receivedLength / fileSize;
          setImportProgress(progress * 0.5);
        }
      }

      const allChunks = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      const blob = new Blob([allChunks]);
      return { blob, fileSize: receivedLength };
    },
    []
  );

  /**
   * Import a dataset from HuggingFace
   */
  const importFromHuggingFace = useCallback(
    async (datasetId: string, options: HFImportOptions = {}): Promise<HFImportResult> => {
      try {
        setIsImporting(true);
        setImportProgress(0);
        setError(null);
        setImportStatus("Validating dataset ID...");

        // Parse and validate dataset ID
        const idValidation = parseDatasetId(datasetId);
        if (!idValidation.isValid) {
          throw new Error(idValidation.error || 'Invalid dataset ID');
        }

        const { organization, dataset } = idValidation;
        console.log(`[HFImport] Importing dataset: ${organization}/${dataset}`);

        setImportProgress(0.1);
        setImportStatus("Fetching dataset information...");

        // Get dataset metadata
        const datasetInfo = await getDatasetInfo(datasetId, options.authToken);
        
        setImportProgress(0.2);
        setImportStatus("Getting parquet files...");

        // Get parquet files list
        const config = options.config || "default";
        const parquetInfo = await getParquetFiles(datasetId, config, options.authToken);

        if (!parquetInfo.parquet_files || parquetInfo.parquet_files.length === 0) {
          throw new Error("No parquet files available for this dataset configuration.");
        }

        // For now, take the first parquet file (we can enhance this later to handle multiple splits)
        const firstParquetFile = parquetInfo.parquet_files[0];
        const parquetUrl = firstParquetFile.url;
        const split = firstParquetFile.split || "train";

        console.log(`[HFImport] Using parquet file: ${parquetUrl}`);

        setImportProgress(0.3);

        // Download parquet file with CORS fallback
        const fileName = `${dataset}_${split}.parquet`;
        const { blob, method, fileSize } = await fetchWithCORSFallback(parquetUrl, fileName);

        setImportProgress(0.6);
        setImportStatus("Processing parquet file with DuckDB...");

        // Create a proper filename
        const cleanDatasetName = dataset.replace(/[^a-zA-Z0-9_-]/g, '_');
        const finalFileName = `${cleanDatasetName}_${split}.parquet`;

        const file = new File([blob], finalFileName, { type: 'application/octet-stream' });

        // Import using DuckDB
        const importResult = await duckDB.importFileDirectly(file);

        setImportProgress(0.8);
        setImportStatus("Getting data preview...");

        // Get schema and sample data
        const schemaResult = await duckDB.executeQuery(
          `PRAGMA table_info("${importResult.tableName}")`
        );

        if (!schemaResult) {
          throw new Error("Failed to get table schema");
        }

        const sampleResult = await duckDB.executeQuery(
          `SELECT * FROM "${importResult.tableName}" LIMIT 1000`
        );

        if (!sampleResult) {
          throw new Error("Failed to get data sample");
        }

        // Convert to expected format
        const headers = schemaResult.toArray().map((col: any) => col.name);
        const sampleData = [
          headers,
          ...sampleResult.toArray().map((row: any) =>
            headers.map((col: string) => {
              const value = row[col];
              return value !== null && value !== undefined ? String(value) : "";
            })
          ),
        ];

        // Detect column types from schema
        const columnTypes = schemaResult.toArray().map((col: any) => {
          const type = col.type.toLowerCase();
          if (type.includes("int") || type.includes("float") || type.includes("double")) {
            return ColumnType.Number;
          } else if (type.includes("bool")) {
            return ColumnType.Boolean;
          } else if (type.includes("date") || type.includes("time")) {
            return ColumnType.Date;
          } else if (type.includes("json") || type.includes("object")) {
            return ColumnType.Object;
          } else if (type.includes("array") || type.includes("list")) {
            return ColumnType.Array;
          } else {
            return ColumnType.Text;
          }
        });

        const sourceType = getDataSourceTypeFromExtension();

        setImportProgress(1.0);
        setImportStatus(`Successfully imported ${importResult.rowCount.toLocaleString()} rows from HuggingFace`);

        const result: HFImportResult = {
          data: sampleData,
          columnTypes,
          fileName: finalFileName,
          rowCount: importResult.rowCount,
          columnCount: headers.length,
          sourceType,
          loadedToDuckDB: true,
          tableName: importResult.tableName,
          huggingface: {
            datasetId,
            config,
            split,
            parquetUrl,
            fileSize,
            method,
            metadata: datasetInfo,
          },
        };

        console.log(`[HFImport] Successfully imported HuggingFace dataset: ${finalFileName}`);
        return result;

      } catch (err) {
        console.error("[HFImport] Import failed:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      } finally {
        setIsImporting(false);
        // Reset progress after a delay
        setTimeout(() => {
          setImportProgress(0);
          setImportStatus("");
        }, 2000);
      }
    },
    [duckDB, parseDatasetId, getDatasetInfo, getParquetFiles, fetchWithCORSFallback]
  );

  /**
   * Test if a dataset is accessible
   */
  const testDatasetAccess = useCallback(
    async (datasetId: string, authToken?: string): Promise<boolean> => {
      try {
        const idValidation = parseDatasetId(datasetId);
        if (!idValidation.isValid) {
          return false;
        }

        await getDatasetInfo(datasetId, authToken);
        return true;
      } catch (err) {
        console.warn("[HFImport] Access test failed:", err);
        return false;
      }
    },
    [parseDatasetId, getDatasetInfo]
  );

  /**
   * Search datasets on HuggingFace Hub
   */
  const searchDatasets = useCallback(
    async (query: string, options: { limit?: number; authToken?: string } = {}): Promise<any[]> => {
      try {
        const { limit = 10, authToken } = options;
        
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };

        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const searchParams = new URLSearchParams({
          search: query,
          limit: limit.toString(),
          filter: 'dataset-type:parquet', // Only show datasets with parquet support
        });

        const response = await fetch(`${HF_HUB_API}?${searchParams}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        }

        const results = await response.json();
        return results || [];

      } catch (err) {
        console.error("[HFImport] Search failed:", err);
        return [];
      }
    },
    []
  );

  /**
   * Get dataset splits and configurations
   */
  const getDatasetSplits = useCallback(
    async (datasetId: string, authToken?: string): Promise<any> => {
      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };

        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${HF_API_BASE}/splits?dataset=${datasetId}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch splits: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (err) {
        console.warn("[HFImport] Failed to get splits:", err);
        return null;
      }
    },
    []
  );

  /**
   * Validate dataset ID format
   */
  const validateDatasetId = useCallback(
    (datasetId: string): DatasetIdValidation => {
      return parseDatasetId(datasetId);
    },
    [parseDatasetId]
  );

  return {
    // State
    isImporting,
    importProgress,
    importStatus,
    error,

    // Actions
    importFromHuggingFace,
    testDatasetAccess,
    validateDatasetId,
    parseDatasetId,
    searchDatasets,
    getDatasetSplits,

    // Utilities
    resetError: () => setError(null),
  };
}
export enum ColumnType {
  Unknown = 'unknown',
  Text = 'text',
  Number = 'number',
  Boolean = 'boolean',
  Date = 'date',
  Array = 'array',
  Object = 'object'
}

export type CSVData = string[][];

export interface CSVParseOptions {
  delimiter?: string;
  header?: boolean;
  skipEmptyLines?: boolean;
  dynamicTyping?: boolean;
}

export interface CSVParseResult {
  data: CSVData;
  columnTypes: ColumnType[];
  fileName: string;
  rowCount: number;
  columnCount: number;
  stats?: {
    bytesProcessed: number;
    rowsProcessed: number;
    chunksProcessed: number;
    totalBytes?: number;
  };
}
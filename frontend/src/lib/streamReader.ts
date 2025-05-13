/**
 * StreamReader provides utilities for efficiently reading and processing file streams in chunks
 */

export interface StreamReaderOptions {
    chunkSize?: number; // Size of chunks to process at once (in bytes)
    onProgress?: (bytesProcessed: number, totalBytes?: number) => void;
  }
  
  export class StreamReader {
    private reader: ReadableStreamDefaultReader<Uint8Array>;
    private bytesProcessed: number = 0;
    private aborted: boolean = false;
    
    constructor(
      private stream: ReadableStream<Uint8Array>,
      private options: StreamReaderOptions = {}
    ) {
      this.reader = stream.getReader();
    }
    
    /**
     * Read the entire stream and return as Uint8Array
     * 
     * Note: Only use for smaller files, as this loads everything into memory
     */
    async readAll(): Promise<{ data: Uint8Array; bytesProcessed: number }> {
      const chunks: Uint8Array[] = [];
      let totalSize = 0;
      
      try {
        while (!this.aborted) {
          const { done, value } = await this.reader.read();
          
          if (done) break;
          
          chunks.push(value);
          totalSize += value.length;
          this.bytesProcessed += value.length;
          
          if (this.options.onProgress) {
            this.options.onProgress(this.bytesProcessed);
          }
        }
        
        // Combine all chunks into a single Uint8Array
        const result = new Uint8Array(totalSize);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        return { data: result, bytesProcessed: this.bytesProcessed };
      } catch (error) {
        if (!this.aborted) {
          console.error('Error reading stream:', error);
          throw error;
        }
        
        return { data: new Uint8Array(0), bytesProcessed: this.bytesProcessed };
      }
    }
    
    /**
     * Process the stream in chunks
     */
    async readByChunks(
      callback: (chunk: Uint8Array, bytesProcessed: number) => Promise<void> | void
    ): Promise<number> {
      try {
        while (!this.aborted) {
          const { done, value } = await this.reader.read();
          
          if (done) break;
          
          this.bytesProcessed += value.length;
          
          // Process the chunk
          await callback(value, this.bytesProcessed);
          
          if (this.options.onProgress) {
            this.options.onProgress(this.bytesProcessed);
          }
        }
        
        return this.bytesProcessed;
      } catch (error) {
        if (!this.aborted) {
          console.error('Error reading stream by chunks:', error);
          throw error;
        }
        
        return this.bytesProcessed;
      }
    }
    
    /**
     * Process a text stream line by line (for CSV, etc.)
     * This handles cases where lines span multiple chunks.
     */
    async readLines(
      callback: (line: string, lineNumber: number) => Promise<void> | void,
      options: {
        skipFirst?: boolean; // Skip first line (e.g., for headers)
        maxLines?: number; // Maximum number of lines to process (for sampling)
      } = {}
    ): Promise<{ lineCount: number; bytesProcessed: number }> {
      const { skipFirst = false, maxLines = Infinity } = options;
      const textDecoder = new TextDecoder();
      let buffer = '';
      let lineCount = 0;
      let processedLines = 0;
      
      try {
        while (!this.aborted) {
          const { done, value } = await this.reader.read();
          
          if (done) {
            // Process any remaining data in buffer
            if (buffer.length > 0) {
              lineCount++;
              if (!skipFirst || lineCount > 1) {
                processedLines++;
                if (processedLines <= maxLines) {
                  await callback(buffer, lineCount);
                }
              }
            }
            break;
          }
          
          this.bytesProcessed += value.length;
          
          // Decode chunk and add to buffer
          const text = textDecoder.decode(value, { stream: true });
          buffer += text;
          
          // Process complete lines
          let lineEndIndex;
          while ((lineEndIndex = buffer.indexOf('\n')) !== -1 && processedLines < maxLines) {
            const line = buffer.substring(0, lineEndIndex).trim();
            buffer = buffer.substring(lineEndIndex + 1);
            
            if (line.length > 0) {
              lineCount++;
              if (!skipFirst || lineCount > 1) {
                processedLines++;
                if (processedLines <= maxLines) {
                  await callback(line, lineCount);
                }
              }
            }
            
            if (processedLines >= maxLines) {
              break;
            }
          }
          
          if (this.options.onProgress) {
            this.options.onProgress(this.bytesProcessed);
          }
          
          if (processedLines >= maxLines) {
            // We've reached the maximum lines to process
            this.abort();
            break;
          }
        }
        
        return { lineCount, bytesProcessed: this.bytesProcessed };
      } catch (error) {
        if (!this.aborted) {
          console.error('Error reading lines from stream:', error);
          throw error;
        }
        
        return { lineCount, bytesProcessed: this.bytesProcessed };
      }
    }
    
    /**
     * Abort reading the stream
     */
    abort(): void {
      this.aborted = true;
      this.reader.cancel().catch(console.error);
    }
    
    /**
     * Get the number of bytes processed so far
     */
    getBytesProcessed(): number {
      return this.bytesProcessed;
    }
  }
  
  /**
   * Create a StreamReader from a file
   */
  export function createFileStreamReader(
    file: File,
    options: StreamReaderOptions = {}
  ): StreamReader {
    return new StreamReader(file.stream(), options);
  }
  
  /**
   * Create a StreamReader from a FileSystemFileHandle
   */
  export async function createHandleStreamReader(
    handle: FileSystemFileHandle,
    options: StreamReaderOptions = {}
  ): Promise<StreamReader> {
    const file = await handle.getFile();
    return createFileStreamReader(file, options);
  }
  
  /**
   * Utility to sample a large file to see its structure
   * This is useful for CSV/JSON files to detect headers and data formats
   */
  export async function sampleFileLines(
    file: File,
    options: {
      maxLines?: number;
      skipFirst?: boolean;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<string[]> {
    const { maxLines = 100, skipFirst = false, onProgress } = options;
    const reader = createFileStreamReader(file, { onProgress });
    const lines: string[] = [];
    
    await reader.readLines(
      (line) => {
        lines.push(line);
      },
      { skipFirst, maxLines }
    );
    
    return lines;
  }
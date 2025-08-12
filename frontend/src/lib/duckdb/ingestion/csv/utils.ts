import * as duckdb from "@duckdb/duckdb-wasm";

async function importCsvWithFallback(
  conn: duckdb.AsyncDuckDBConnection,
  escapedTableName: string,
  registeredFileName: string,
  isStreaming: boolean = false
): Promise<void> {
  let success = false;
  let createQuery = "";

  // Determine which read function to use based on method
  const readFunction = isStreaming ? "read_csv" : "read_csv_auto";

  // Approach 1: Standard auto-detection
  try {
    if (isStreaming) {
      createQuery = `CREATE TABLE ${escapedTableName} AS SELECT * FROM ${readFunction}('${registeredFileName}', 
          header=true, 
          auto_detect=true,
          strict_mode=false
        )`;
    } else {
      createQuery = `CREATE TABLE ${escapedTableName} AS SELECT * FROM ${readFunction}('${registeredFileName}', 
          header=true, 
          auto_detect=true
        )`;
    }

    console.log(
      `[DuckDBStore] Trying standard CSV import (${
        isStreaming ? "streaming" : "direct"
      })`
    );
    await conn.query(createQuery);
    success = true;
  } catch (err1) {
    console.log(
      `[DuckDBStore] Standard ${
        isStreaming ? "streaming" : "direct"
      } approach failed:`,
      err1
    );

    // Approach 2: Increase sample size for better type detection
    try {
      await conn.query(`DROP TABLE IF EXISTS ${escapedTableName}`);
      createQuery = `CREATE TABLE ${escapedTableName} AS SELECT * FROM ${readFunction}('${registeredFileName}', 
          header=true, 
          auto_detect=true,
          strict_mode=false,
          sample_size=-1,
          ignore_errors=true
        )`;

      console.log(
        `[DuckDBStore] Trying CSV import with full sample size (${
          isStreaming ? "streaming" : "direct"
        })`
      );
      await conn.query(createQuery);
      success = true;
    } catch (err2) {
      console.log(`[DuckDBStore] Full sample approach failed:`, err2);

      // Approach 3: Force all columns to VARCHAR
      try {
        await conn.query(`DROP TABLE IF EXISTS ${escapedTableName}`);
        createQuery = `CREATE TABLE ${escapedTableName} AS SELECT * FROM ${readFunction}('${registeredFileName}', 
            header=true, 
            all_varchar=true,
            strict_mode=false,
            ignore_errors=true
          )`;

        console.log(
          `[DuckDBStore] Trying CSV import with all VARCHAR columns (${
            isStreaming ? "streaming" : "direct"
          })`
        );
        await conn.query(createQuery);
        success = true;
      } catch (err3) {
        console.log(`[DuckDBStore] VARCHAR approach failed:`, err3);

        // Approach 4: Most permissive settings
        try {
          await conn.query(`DROP TABLE IF EXISTS ${escapedTableName}`);
          createQuery = `CREATE TABLE ${escapedTableName} AS SELECT * FROM ${readFunction}('${registeredFileName}', 
              header=true, 
              all_varchar=true,
              strict_mode=false,
              ignore_errors=true,
              max_line_size=1048576,
              normalize_names=true
            )`;

          console.log(
            `[DuckDBStore] Trying most permissive CSV import (${
              isStreaming ? "streaming" : "direct"
            })`
          );
          await conn.query(createQuery);
          success = true;
        } catch (err4) {
          console.log(
            `[DuckDBStore] All CSV import approaches failed (${
              isStreaming ? "streaming" : "direct"
            })`
          );
          throw new Error(
            `Failed to import CSV file. Last error: ${
              err4 instanceof Error ? err4.message : String(err4)
            }`
          );
        }
      }
    }
  }

  if (!success) {
    throw new Error(
      `Failed to import CSV file after trying multiple approaches`
    );
  }
}

// For CSV views (streaming method, large files >500MB)
async function createCsvViewWithFallback(
  conn: duckdb.AsyncDuckDBConnection,
  escapedTableName: string,
  registeredFileName: string
): Promise<void> {
  let success = false;
  let createQuery = "";

  // Approach 1: Standard view creation
  try {
    createQuery = `CREATE VIEW ${escapedTableName} AS SELECT * FROM read_csv('${registeredFileName}', 
        header=true, 
        auto_detect=true,
        strict_mode=false,
        parallel=false
      )`;

    console.log(`[DuckDBStore] Trying standard CSV view creation`);
    await conn.query(createQuery);
    success = true;
  } catch (err1) {
    console.log(`[DuckDBStore] Standard view approach failed:`, err1);

    // Approach 2: Permissive view creation
    try {
      createQuery = `CREATE VIEW ${escapedTableName} AS SELECT * FROM read_csv('${registeredFileName}', 
          header=true, 
          all_varchar=true,
          strict_mode=false,
          ignore_errors=true,
          sample_size=-1,
          parallel=false
        )`;

      console.log(`[DuckDBStore] Trying permissive CSV view creation`);
      await conn.query(createQuery);
      success = true;
    } catch (err2) {
      throw new Error(
        `Failed to create CSV view: ${
          err2 instanceof Error ? err2.message : String(err2)
        }`
      );
    }
  }

  if (!success) {
    throw new Error(
      `Failed to create CSV view after trying multiple approaches`
    );
  }
}

export { importCsvWithFallback, createCsvViewWithFallback };

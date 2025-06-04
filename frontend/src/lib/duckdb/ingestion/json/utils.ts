import * as duckdb from "@duckdb/duckdb-wasm";

async function importJsonWithFallback(
  conn: duckdb.AsyncDuckDBConnection,
  escapedTableName: string,
  registeredFileName: string,
  isStreaming: boolean = false
): Promise<void> {
  let success = false;
  let createQuery = "";

  const readFunction = "read_json";

  // Approach 1: Standard auto-detection
  try {
    createQuery = `CREATE TABLE ${escapedTableName} AS SELECT * FROM ${readFunction}('${registeredFileName}', 
        auto_detect=true
      )`;

    console.log(
      `[DuckDBStore] Trying standard JSON import (${
        isStreaming ? "streaming" : "direct"
      })`
    );
    await conn.query(createQuery);
    success = true;
  } catch (err1) {
    console.log(`[DuckDBStore] Standard JSON approach failed:`, err1);

    // Approach 2: Increase sample size and set union_by_name
    try {
      await conn.query(`DROP TABLE IF EXISTS ${escapedTableName}`);
      createQuery = `CREATE TABLE ${escapedTableName} AS SELECT * FROM ${readFunction}('${registeredFileName}', 
          auto_detect=true,
          sample_size=-1,
          union_by_name=true,
          ignore_errors=true
        )`;

      console.log(
        `[DuckDBStore] Trying JSON import with union_by_name (${
          isStreaming ? "streaming" : "direct"
        })`
      );
      await conn.query(createQuery);
      success = true;
    } catch (err2) {
      console.log(`[DuckDBStore] Union by name approach failed:`, err2);

      // Approach 3: Force records format for line-delimited JSON
      try {
        await conn.query(`DROP TABLE IF EXISTS ${escapedTableName}`);
        createQuery = `CREATE TABLE ${escapedTableName} AS SELECT * FROM ${readFunction}('${registeredFileName}', 
            format='newline_delimited',
            ignore_errors=true,
            sample_size=-1
          )`;

        console.log(
          `[DuckDBStore] Trying JSON import with newline_delimited format (${
            isStreaming ? "streaming" : "direct"
          })`
        );
        await conn.query(createQuery);
        success = true;
      } catch (err3) {
        console.log(`[DuckDBStore] Newline delimited approach failed:`, err3);

        // Approach 4: Records format with reduced depth
        try {
          await conn.query(`DROP TABLE IF EXISTS ${escapedTableName}`);
          createQuery = `CREATE TABLE ${escapedTableName} AS SELECT * FROM ${readFunction}('${registeredFileName}', 
              format='records',
              maximum_depth=5,
              ignore_errors=true,
              sample_size=10000
            )`;

          console.log(
            `[DuckDBStore] Trying JSON import with records format and reduced depth (${
              isStreaming ? "streaming" : "direct"
            })`
          );
          await conn.query(createQuery);
          success = true;
        } catch (err4) {
          console.log(`[DuckDBStore] Records format approach failed:`, err4);

          // Approach 5: Most permissive - try to read as text and parse later
          try {
            await conn.query(`DROP TABLE IF EXISTS ${escapedTableName}`);
            createQuery = `CREATE TABLE ${escapedTableName} AS SELECT * FROM ${readFunction}('${registeredFileName}', 
                format='auto',
                ignore_errors=true,
                maximum_depth=3,
                sample_size=5000,
                union_by_name=true
              )`;

            console.log(
              `[DuckDBStore] Trying most permissive JSON import (${
                isStreaming ? "streaming" : "direct"
              })`
            );
            await conn.query(createQuery);
            success = true;
          } catch (err5) {
            console.log(
              `[DuckDBStore] All JSON import approaches failed (${
                isStreaming ? "streaming" : "direct"
              })`
            );
            throw new Error(
              `Failed to import JSON file. The file may have mixed or complex structures. Last error: ${
                err5 instanceof Error ? err5.message : String(err5)
              }`
            );
          }
        }
      }
    }
  }

  if (!success) {
    throw new Error(
      `Failed to import JSON file after trying multiple approaches`
    );
  }
}

async function createJsonViewWithFallback(
  conn: duckdb.AsyncDuckDBConnection,
  escapedTableName: string,
  registeredFileName: string
): Promise<void> {
  let success = false;
  let createQuery = "";

  // Approach 1: Standard view creation
  try {
    createQuery = `CREATE VIEW ${escapedTableName} AS SELECT * FROM read_json('${registeredFileName}', 
        auto_detect=true
      )`;

    console.log(`[DuckDBStore] Trying standard JSON view creation`);
    await conn.query(createQuery);
    success = true;
  } catch (err1) {
    console.log(`[DuckDBStore] Standard JSON view approach failed:`, err1);

    // Approach 2: Permissive view creation
    try {
      createQuery = `CREATE VIEW ${escapedTableName} AS SELECT * FROM read_json('${registeredFileName}', 
          auto_detect=true,
          ignore_errors=true,
          union_by_name=true,
          sample_size=-1,
          maximum_depth=5
        )`;

      console.log(`[DuckDBStore] Trying permissive JSON view creation`);
      await conn.query(createQuery);
      success = true;
    } catch (err2) {
      // Approach 3: Try newline-delimited format for views
      try {
        createQuery = `CREATE VIEW ${escapedTableName} AS SELECT * FROM read_json('${registeredFileName}', 
            format='newline_delimited',
            ignore_errors=true,
            sample_size=10000
          )`;

        console.log(
          `[DuckDBStore] Trying newline-delimited JSON view creation`
        );
        await conn.query(createQuery);
        success = true;
      } catch (err3) {
        throw new Error(
          `Failed to create JSON view: ${
            err3 instanceof Error ? err3.message : String(err3)
          }`
        );
      }
    }
  }

  if (!success) {
    throw new Error(
      `Failed to create JSON view after trying multiple approaches`
    );
  }
}

export { importJsonWithFallback, createJsonViewWithFallback };

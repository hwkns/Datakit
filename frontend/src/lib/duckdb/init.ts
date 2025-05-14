import * as duckdb from "@duckdb/duckdb-wasm";
import { duckDBConfig, getBundles, cleanupWorkerBlobUrls } from "./config";

let currentBundles: duckdb.DuckDBBundles | null = null;

export async function initializeDuckDB() {
  try {
    console.log("[DuckDBInit] Starting DuckDB initialization...");

    // Get bundles based on environment
    currentBundles = await getBundles();
    const bundle = await duckdb.selectBundle(currentBundles);
    console.log("[DuckDBInit] Selected bundle:", bundle);

    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);

    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    const conn = await db.connect();

    // Configure DuckDB settings
    await configureDuckDB(conn);

    return { db, conn };
  } catch (err) {
    // Clean up any created blob URLs on error
    if (currentBundles) {
      cleanupWorkerBlobUrls(currentBundles);
    }
    console.error("[DuckDBInit] Failed to initialize DuckDB:", err);
    throw new Error(
      `Failed to initialize DuckDB: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

async function configureDuckDB(conn: duckdb.AsyncDuckDBConnection) {
  try {
    console.log("[DuckDBInit] Configuring DuckDB settings...");

    // Set memory limits
    await conn.query(`PRAGMA memory_limit='${duckDBConfig.MEMORY_LIMIT}'`);
    console.log("[DuckDBInit] Set memory limit to", duckDBConfig.MEMORY_LIMIT);

    // Set temporary directory if supported
    try {
      await conn.query(
        `PRAGMA temp_directory='${duckDBConfig.TEMP_DIRECTORY}'`
      );
      console.log("[DuckDBInit] Set temp directory");
    } catch (tempDirErr) {
      console.log(
        "[DuckDBInit] Temp directory configuration not supported, proceeding without it"
      );
    }

    // Load required extensions
    for (const extension of duckDBConfig.REQUIRED_EXTENSIONS) {
      try {
        await conn.query(`INSTALL ${extension}`);
        await conn.query(`LOAD ${extension}`);
        console.log(`[DuckDBInit] ${extension} extension loaded`);
      } catch (extErr) {
        console.log(
          `[DuckDBInit] ${extension} extension not available, proceeding without it`
        );
      }
    }
  } catch (configErr) {
    console.warn(
      "[DuckDBInit] Failed to configure DuckDB (non-critical):",
      configErr
    );
  }
}

export function cleanup() {
  if (currentBundles) {
    cleanupWorkerBlobUrls(currentBundles);
    currentBundles = null;
  }
}

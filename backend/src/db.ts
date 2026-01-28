import { Pool } from "pg";
import { config } from "./config";

/**
 * Shared PostgreSQL connection pool for the application.
 */
export const pool = new Pool({ connectionString: config.databaseUrl });

/**
 * Verifies database connectivity by performing a lightweight query.
 */
export async function verifyConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

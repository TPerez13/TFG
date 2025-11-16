import { Pool } from "pg";
import { config } from "./config";

export const pool = new Pool({connectionString: config.databaseUrl});

//Funcion de validación de la bbdd
export async function verifyConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

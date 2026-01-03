import { pool } from "../db";

export interface UserRecord {
  id: number;
  username: string;
  password_hash: string;
}

// Acceso a datos: busca un usuario por username; devuelve null si no existe.
export async function findByUsername(username: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    "SELECT id, username, password_hash FROM users WHERE username = $1",
    [username]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0];
}

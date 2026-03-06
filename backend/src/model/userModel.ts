import { pool } from "../db";

/**
 * User row representation as stored in the database.
 * Mirrors the usuario table columns and their semantics.
 */
export interface UserRecord {
  id_usuario: number;
  correo: string;
  nombre: string;
  hash_clave: string;
  preferencias: Record<string, unknown> | null;
  f_creacion: string | Date;
}

/**
 * Data required to create a user record.
 * The password must be hashed before persistence.
 */
export interface CreateUserInput {
  correo: string;
  nombre: string;
  hash_clave: string;
  preferencias: Record<string, unknown> | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const deepMerge = (
  current: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>
): Record<string, unknown> => {
  const base = isRecord(current) ? current : {};
  const next = { ...base };

  Object.entries(patch).forEach(([key, value]) => {
    if (isRecord(value) && isRecord(base[key])) {
      next[key] = deepMerge(base[key] as Record<string, unknown>, value);
      return;
    }
    next[key] = value;
  });

  return next;
};

export async function updatePreferences(
  userId: number,
  preferences: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const currentResult = await pool.query<{ preferencias: Record<string, unknown> | null }>(
    "SELECT preferencias FROM usuario WHERE id_usuario = $1",
    [userId]
  );
  const current = currentResult.rows[0]?.preferencias ?? {};
  const merged = deepMerge(current, preferences);

  const result = await pool.query<{ preferencias: Record<string, unknown> | null }>(
    `UPDATE usuario
        SET preferencias = $2::jsonb
      WHERE id_usuario = $1
      RETURNING preferencias`,
    [userId, JSON.stringify(merged)]
  );

  return result.rows[0]?.preferencias ?? merged;
}

/**
 * Deletes a user record by id.
 * Related entities are removed by DB-level ON DELETE CASCADE constraints.
 */
export async function deleteUserById(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM usuario WHERE id_usuario = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Retrieves a user by primary key.
 * Side effects: database read.
 */
export async function findById(id: number): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    "SELECT id_usuario, correo, nombre, hash_clave, preferencias, f_creacion FROM usuario WHERE id_usuario = $1",
    [id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Retrieves a user by email.
 * Side effects: database read.
 */
export async function findByEmail(correo: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    "SELECT id_usuario, correo, nombre, hash_clave, preferencias, f_creacion FROM usuario WHERE correo = $1",
    [correo]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Creates a user and returns the persisted record.
 * Side effects: database write.
 */
export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    "INSERT INTO usuario (correo, nombre, hash_clave, preferencias) VALUES ($1, $2, $3, $4) RETURNING id_usuario, correo, nombre, hash_clave, preferencias, f_creacion",
    [input.correo, input.nombre, input.hash_clave, input.preferencias]
  );

  return result.rows[0];
}

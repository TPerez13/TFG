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

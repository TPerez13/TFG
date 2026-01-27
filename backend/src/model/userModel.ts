import { pool } from "../db";

export interface UserRecord {
  id_usuario: number;
  correo: string;
  nombre: string;
  hash_clave: string;
  preferencias: Record<string, unknown> | null;
  f_creacion: string | Date;
}

export interface CreateUserInput {
  correo: string;
  nombre: string;
  hash_clave: string;
  preferencias: Record<string, unknown> | null;
}

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

// Acceso a datos: busca un usuario por correo; devuelve null si no existe.
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

// Crea un usuario con hash de contrasena y devuelve el registro completo.
export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    "INSERT INTO usuario (correo, nombre, hash_clave, preferencias) VALUES ($1, $2, $3, $4) RETURNING id_usuario, correo, nombre, hash_clave, preferencias, f_creacion",
    [input.correo, input.nombre, input.hash_clave, input.preferencias]
  );

  return result.rows[0];
}

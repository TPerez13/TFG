import { pool } from "../db";

/**
 * Habit entry row representation as stored in the database.
 * Mirrors registro_habito columns and their semantics.
 */
export interface HabitEntryRecord {
  id_registro_habito: number;
  id_usuario: number;
  id_tipo_habito: number;
  f_registro: string | Date;
  valor: number;
  unidad: string | null;
  notas: string | null;
}

/**
 * Lists habit entries for a user within a date-time range.
 * Side effects: database read.
 */
export async function listEntriesForUser(
  userId: number,
  from: string,
  to: string
): Promise<HabitEntryRecord[]> {
  const result = await pool.query<HabitEntryRecord>(
    `SELECT id_registro_habito,
            id_usuario,
            id_tipo_habito,
            f_registro,
            valor::float AS valor,
            unidad,
            notas
       FROM registro_habito
      WHERE id_usuario = $1
        AND f_registro >= $2
        AND f_registro <= $3
      ORDER BY f_registro ASC`,
    [userId, from, to]
  );

  return result.rows;
}

/**
 * Lists recent habit entries for export purposes.
 * Side effects: database read.
 */
export async function listEntriesForUserExport(
  userId: number,
  limit = 500
): Promise<HabitEntryRecord[]> {
  const result = await pool.query<HabitEntryRecord>(
    `SELECT id_registro_habito,
            id_usuario,
            id_tipo_habito,
            f_registro,
            valor::float AS valor,
            unidad,
            notas
       FROM registro_habito
      WHERE id_usuario = $1
      ORDER BY f_registro DESC
      LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
}

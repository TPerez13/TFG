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

export interface CreateHabitEntryInput {
  userId: number;
  typeId: number;
  value: number;
  unit?: string | null;
  dateTimeIso: string;
  notes?: string | null;
}

/**
 * Lists habit entries for a user within a date-time range.
 * Side effects: database read.
 */
export async function listEntriesForUser(
  userId: number,
  from: string,
  to: string,
  typeId?: number
): Promise<HabitEntryRecord[]> {
  const params: Array<number | string> = [userId, from, to];
  const whereType = typeof typeId === "number" ? " AND id_tipo_habito = $4" : "";
  if (typeof typeId === "number") {
    params.push(typeId);
  }

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
        AND f_registro <= $3${whereType}
      ORDER BY f_registro ASC`,
    params
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

export async function createHabitEntryForUser(
  input: CreateHabitEntryInput
): Promise<HabitEntryRecord> {
  const result = await pool.query<HabitEntryRecord>(
    `INSERT INTO registro_habito (
        id_usuario,
        id_tipo_habito,
        f_registro,
        valor,
        unidad,
        notas
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_registro_habito,
                id_usuario,
                id_tipo_habito,
                f_registro,
                valor::float AS valor,
                unidad,
                notas`,
    [
      input.userId,
      input.typeId,
      input.dateTimeIso,
      input.value,
      input.unit ?? null,
      input.notes ?? null,
    ]
  );

  return result.rows[0];
}

export async function deleteHabitEntryForUser(
  userId: number,
  entryId: number
): Promise<HabitEntryRecord | null> {
  const result = await pool.query<HabitEntryRecord>(
    `DELETE FROM registro_habito
      WHERE id_registro_habito = $1
        AND id_usuario = $2
      RETURNING id_registro_habito,
                id_usuario,
                id_tipo_habito,
                f_registro,
                valor::float AS valor,
                unidad,
                notas`,
    [entryId, userId]
  );

  return result.rows[0] ?? null;
}

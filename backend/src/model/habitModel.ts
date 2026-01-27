import { pool } from "../db";

export interface HabitEntryRecord {
  id_registro_habito: number;
  id_usuario: number;
  id_tipo_habito: number;
  f_registro: string | Date;
  valor: number;
  unidad: string | null;
  notas: string | null;
}

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

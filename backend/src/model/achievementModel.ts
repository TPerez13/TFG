import type { AchievementDefinition, AchievementId } from "@muchasvidas/shared";
import { ACHIEVEMENT_DEFINITIONS } from "@muchasvidas/shared";
import { pool } from "../db";

type UnlockedAchievementRow = {
  codigo: string | null;
  f_obtencion: string | Date;
  puntos: number;
};

type UnlockedAchievementRecord = {
  achievementId: AchievementId;
  unlockedAt: string | Date;
  points: number;
};

const ACHIEVEMENT_IDS = new Set<AchievementId>(ACHIEVEMENT_DEFINITIONS.map((item) => item.id));

const isAchievementId = (value: string | null): value is AchievementId =>
  typeof value === "string" && ACHIEVEMENT_IDS.has(value as AchievementId);

const toCriteriaJson = (definition: AchievementDefinition) =>
  JSON.stringify(definition.criteria);

async function upsertAchievementDefinition(definition: AchievementDefinition): Promise<void> {
  const params = [
    definition.id,
    definition.title,
    definition.description,
    toCriteriaJson(definition),
    definition.points,
    definition.icon,
    definition.difficulty,
    definition.sharePriority,
  ];

  const updated = await pool.query(
    `UPDATE logro
        SET codigo = $1,
            nombre = $2,
            descripcion = $3,
            criterio = $4::jsonb,
            puntos = $5,
            icono = $6,
            dificultad = $7,
            prioridad_compartir = $8
      WHERE codigo = $1
         OR nombre = $2`,
    params
  );

  if ((updated.rowCount ?? 0) > 0) {
    return;
  }

  await pool.query(
    `INSERT INTO logro (
        codigo,
        nombre,
        descripcion,
        criterio,
        puntos,
        icono,
        dificultad,
        prioridad_compartir
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)`,
    params
  );
}

export async function syncAchievementCatalog(
  definitions: readonly AchievementDefinition[]
): Promise<void> {
  for (const definition of definitions) {
    await upsertAchievementDefinition(definition);
  }
}

export async function listUnlockedAchievementsForUser(
  userId: number
): Promise<UnlockedAchievementRecord[]> {
  const result = await pool.query<UnlockedAchievementRow>(
    `SELECT l.codigo,
            ul.f_obtencion,
            ul.puntos
       FROM usuario_logro ul
       JOIN logro l
         ON l.id_logro = ul.id_logro
      WHERE ul.id_usuario = $1
      ORDER BY ul.f_obtencion ASC`,
    [userId]
  );

  return result.rows.flatMap((row) =>
    isAchievementId(row.codigo)
      ? [
          {
            achievementId: row.codigo,
            unlockedAt: row.f_obtencion,
            points: row.puntos,
          },
        ]
      : []
  );
}

export async function grantAchievementToUser(
  userId: number,
  achievementId: AchievementId,
  unlockedAtIso: string,
  points: number
): Promise<boolean> {
  const result = await pool.query(
    `INSERT INTO usuario_logro (id_usuario, id_logro, f_obtencion, puntos)
     SELECT $1, l.id_logro, $3, $4
       FROM logro l
      WHERE l.codigo = $2
      ON CONFLICT (id_usuario, id_logro) DO NOTHING`,
    [userId, achievementId, unlockedAtIso, points]
  );

  return (result.rowCount ?? 0) > 0;
}

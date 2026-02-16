import { pool } from "../db";

export const MEAL_TYPES = ["DESAYUNO", "ALMUERZO", "CENA", "SNACK"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export interface NutritionEntryRecord {
  id_registro_comida: number;
  id_usuario: number;
  f_registro: string | Date;
  tipo_comida: MealType;
  id_alimento: number | null;
  nombre_snapshot: string;
  kcal: number;
  proteina_g: number | null;
  carbohidratos_g: number | null;
  grasas_g: number | null;
}

export interface NutritionSummaryRecord {
  comidas_registradas: number;
  kcal_total: number;
  proteina_total_g: number;
  carbohidratos_total_g: number;
  grasas_total_g: number;
}

export interface FoodTemplateRecord {
  id_alimento: number | null;
  nombre: string;
  kcal: number;
  proteina_g: number | null;
  carbohidratos_g: number | null;
  grasas_g: number | null;
  veces?: number;
}

export interface CreateNutritionEntryInput {
  tipoComida: MealType;
  alimentoId?: number | null;
  nombre?: string;
  kcal?: number;
  proteinaG?: number | null;
  carbohidratosG?: number | null;
  grasasG?: number | null;
  fRegistro?: string;
}

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

type FoodCatalogRecord = {
  id_alimento: number;
  nombre: string;
  kcal: number;
  proteina_g: number | null;
  carbohidratos_g: number | null;
  grasas_g: number | null;
};

const mapFoodCatalogRow = (row: FoodCatalogRecord): FoodTemplateRecord => ({
  id_alimento: row.id_alimento,
  nombre: row.nombre,
  kcal: Number(row.kcal) || 0,
  proteina_g: toNullableNumber(row.proteina_g),
  carbohidratos_g: toNullableNumber(row.carbohidratos_g),
  grasas_g: toNullableNumber(row.grasas_g),
});

const loadFallbackFoods = async (limit: number): Promise<FoodTemplateRecord[]> => {
  const result = await pool.query<FoodCatalogRecord>(
    `SELECT id_alimento,
            nombre,
            kcal::float AS kcal,
            proteina_g::float AS proteina_g,
            carbohidratos_g::float AS carbohidratos_g,
            grasas_g::float AS grasas_g
       FROM alimento
      ORDER BY id_alimento ASC
      LIMIT $1`,
    [limit]
  );

  return result.rows.map(mapFoodCatalogRow);
};

export async function listNutritionEntriesForDay(
  userId: number,
  fromIso: string,
  toIso: string,
  mealType?: MealType
): Promise<NutritionEntryRecord[]> {
  const params: Array<number | string> = [userId, fromIso, toIso];
  const whereType = mealType ? ` AND tipo_comida = $4` : "";
  if (mealType) {
    params.push(mealType);
  }

  const result = await pool.query<NutritionEntryRecord>(
    `SELECT id_registro_comida,
            id_usuario,
            f_registro,
            tipo_comida,
            id_alimento,
            nombre_snapshot,
            kcal::float AS kcal,
            proteina_g::float AS proteina_g,
            carbohidratos_g::float AS carbohidratos_g,
            grasas_g::float AS grasas_g
       FROM registro_comida
      WHERE id_usuario = $1
        AND f_registro >= $2
        AND f_registro <= $3${whereType}
      ORDER BY f_registro DESC`,
    params
  );

  return result.rows;
}

export async function getNutritionSummaryForDay(
  userId: number,
  fromIso: string,
  toIso: string
): Promise<NutritionSummaryRecord> {
  const result = await pool.query<NutritionSummaryRecord>(
    `SELECT COUNT(*)::int AS comidas_registradas,
            COALESCE(SUM(kcal), 0)::float AS kcal_total,
            COALESCE(SUM(COALESCE(proteina_g, 0)), 0)::float AS proteina_total_g,
            COALESCE(SUM(COALESCE(carbohidratos_g, 0)), 0)::float AS carbohidratos_total_g,
            COALESCE(SUM(COALESCE(grasas_g, 0)), 0)::float AS grasas_total_g
       FROM registro_comida
      WHERE id_usuario = $1
        AND f_registro >= $2
        AND f_registro <= $3`,
    [userId, fromIso, toIso]
  );

  return (
    result.rows[0] ?? {
      comidas_registradas: 0,
      kcal_total: 0,
      proteina_total_g: 0,
      carbohidratos_total_g: 0,
      grasas_total_g: 0,
    }
  );
}

export async function listRecentFoodTemplatesForUser(
  userId: number,
  limit = 10
): Promise<FoodTemplateRecord[]> {
  const result = await pool.query<FoodTemplateRecord>(
    `SELECT DISTINCT ON (LOWER(nombre_snapshot))
            id_alimento,
            nombre_snapshot AS nombre,
            kcal::float AS kcal,
            proteina_g::float AS proteina_g,
            carbohidratos_g::float AS carbohidratos_g,
            grasas_g::float AS grasas_g
       FROM registro_comida
      WHERE id_usuario = $1
      ORDER BY LOWER(nombre_snapshot), f_registro DESC
      LIMIT $2`,
    [userId, limit]
  );

  if (result.rowCount && result.rowCount > 0) {
    return result.rows.map((row) => ({
      id_alimento: row.id_alimento ?? null,
      nombre: row.nombre,
      kcal: Number(row.kcal) || 0,
      proteina_g: toNullableNumber(row.proteina_g),
      carbohidratos_g: toNullableNumber(row.carbohidratos_g),
      grasas_g: toNullableNumber(row.grasas_g),
    }));
  }

  return loadFallbackFoods(limit);
}

export async function listFrequentFoodTemplatesForUser(
  userId: number,
  limit = 10
): Promise<FoodTemplateRecord[]> {
  const result = await pool.query<FoodTemplateRecord>(
    `SELECT MAX(id_alimento) AS id_alimento,
            MIN(nombre_snapshot) AS nombre,
            AVG(kcal)::float AS kcal,
            AVG(proteina_g)::float AS proteina_g,
            AVG(carbohidratos_g)::float AS carbohidratos_g,
            AVG(grasas_g)::float AS grasas_g,
            COUNT(*)::int AS veces
       FROM registro_comida
      WHERE id_usuario = $1
        AND f_registro >= (NOW() - INTERVAL '30 days')
      GROUP BY LOWER(nombre_snapshot)
      ORDER BY veces DESC
      LIMIT $2`,
    [userId, limit]
  );

  if (result.rowCount && result.rowCount > 0) {
    return result.rows.map((row) => ({
      id_alimento: row.id_alimento ?? null,
      nombre: row.nombre,
      kcal: Number(row.kcal) || 0,
      proteina_g: toNullableNumber(row.proteina_g),
      carbohidratos_g: toNullableNumber(row.carbohidratos_g),
      grasas_g: toNullableNumber(row.grasas_g),
      veces: Number(row.veces) || 0,
    }));
  }

  return loadFallbackFoods(limit);
}

const findFoodById = async (alimentoId: number): Promise<FoodCatalogRecord | null> => {
  const result = await pool.query<FoodCatalogRecord>(
    `SELECT id_alimento,
            nombre,
            kcal::float AS kcal,
            proteina_g::float AS proteina_g,
            carbohidratos_g::float AS carbohidratos_g,
            grasas_g::float AS grasas_g
       FROM alimento
      WHERE id_alimento = $1`,
    [alimentoId]
  );

  return result.rows[0] ?? null;
};

export async function createNutritionEntryForUser(
  userId: number,
  input: CreateNutritionEntryInput
): Promise<NutritionEntryRecord> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const food = input.alimentoId ? await findFoodById(input.alimentoId) : null;
    const registeredAt = input.fRegistro ? new Date(input.fRegistro) : new Date();
    if (Number.isNaN(registeredAt.getTime())) {
      throw new Error("Fecha de registro invalida.");
    }

    const name = (input.nombre ?? food?.nombre ?? "").trim();
    if (!name) {
      throw new Error("El nombre de la comida es requerido.");
    }

    const kcalCandidate = Number(input.kcal ?? food?.kcal ?? NaN);
    if (!Number.isFinite(kcalCandidate) || kcalCandidate <= 0) {
      throw new Error("Las calorias deben ser mayores a 0.");
    }

    const proteina = toNullableNumber(input.proteinaG ?? food?.proteina_g ?? null);
    const carbohidratos = toNullableNumber(input.carbohidratosG ?? food?.carbohidratos_g ?? null);
    const grasas = toNullableNumber(input.grasasG ?? food?.grasas_g ?? null);

    const insertResult = await client.query<NutritionEntryRecord>(
      `INSERT INTO registro_comida (
          id_usuario,
          f_registro,
          tipo_comida,
          id_alimento,
          nombre_snapshot,
          kcal,
          proteina_g,
          carbohidratos_g,
          grasas_g
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id_registro_comida,
                  id_usuario,
                  f_registro,
                  tipo_comida,
                  id_alimento,
                  nombre_snapshot,
                  kcal::float AS kcal,
                  proteina_g::float AS proteina_g,
                  carbohidratos_g::float AS carbohidratos_g,
                  grasas_g::float AS grasas_g`,
      [
        userId,
        registeredAt.toISOString(),
        input.tipoComida,
        input.alimentoId ?? null,
        name,
        kcalCandidate,
        proteina,
        carbohidratos,
        grasas,
      ]
    );

    const entry = insertResult.rows[0];

    await client.query(
      `INSERT INTO registro_habito (
          id_usuario,
          id_tipo_habito,
          f_registro,
          valor,
          unidad,
          notas,
          id_registro_comida
        ) VALUES ($1, 2, $2, 1, 'plato', $3, $4)`,
      [userId, registeredAt.toISOString(), name, entry.id_registro_comida]
    );

    await client.query("COMMIT");
    return entry;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteNutritionEntryForUser(
  userId: number,
  entryId: number
): Promise<NutritionEntryRecord | null> {
  const result = await pool.query<NutritionEntryRecord>(
    `DELETE FROM registro_comida
      WHERE id_registro_comida = $1
        AND id_usuario = $2
      RETURNING id_registro_comida,
                id_usuario,
                f_registro,
                tipo_comida,
                id_alimento,
                nombre_snapshot,
                kcal::float AS kcal,
                proteina_g::float AS proteina_g,
                carbohidratos_g::float AS carbohidratos_g,
                grasas_g::float AS grasas_g`,
    [entryId, userId]
  );

  return result.rows[0] ?? null;
}

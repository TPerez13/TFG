import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { AppError } from "../utils/errors";
import { findById } from "../model/userModel";
import {
  MEAL_TYPES,
  createNutritionEntryForUser,
  deleteNutritionEntryForUser,
  getNutritionSummaryForDay,
  listFrequentFoodTemplatesForUser,
  listNutritionEntriesForDay,
  listRecentFoodTemplatesForUser,
  type MealType,
  type NutritionEntryRecord,
} from "../model/nutritionModel";

type NutritionPreferences = {
  goals?: {
    comidas?: {
      value?: number;
    };
  };
  nutricion?: {
    recordatoriosComidas?: boolean;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
};

const isMealType = (value: unknown): value is MealType =>
  typeof value === "string" && (MEAL_TYPES as readonly string[]).includes(value);

const toNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDayRange = (dateValue?: string): { date: string; fromIso: string; toIso: string } => {
  const date = dateValue ?? new Date().toISOString().slice(0, 10);
  const [year, month, day] = date.split("-").map((item) => Number(item));
  if (!year || !month || !day) {
    throw new AppError("date invalida. Usa formato YYYY-MM-DD.", 400);
  }

  const from = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new AppError("date invalida. Usa formato YYYY-MM-DD.", 400);
  }

  return { date, fromIso: from.toISOString(), toIso: to.toISOString() };
};

const toNutritionEntry = (record: NutritionEntryRecord) => ({
  idRegistroComida: record.id_registro_comida,
  idUsuario: record.id_usuario,
  fRegistro: toIsoString(record.f_registro),
  tipoComida: record.tipo_comida,
  alimentoId: record.id_alimento ?? null,
  nombre: record.nombre_snapshot,
  kcal: Number(record.kcal) || 0,
  proteinaG: record.proteina_g ?? null,
  carbohidratosG: record.carbohidratos_g ?? null,
  grasasG: record.grasas_g ?? null,
});

const readGoalFromPreferences = (preferences: unknown): number => {
  if (!isRecord(preferences)) return 4;
  const prefs = preferences as NutritionPreferences;
  const value = Number(prefs.goals?.comidas?.value);
  if (!Number.isFinite(value) || value <= 0) return 4;
  return Math.round(value);
};

const readReminderFromPreferences = (preferences: unknown): boolean => {
  if (!isRecord(preferences)) return false;
  const prefs = preferences as NutritionPreferences;
  return Boolean(prefs.nutricion?.recordatoriosComidas);
};

export async function nutritionToday(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    const mealType =
      typeof req.query.tipoComida === "string"
        ? req.query.tipoComida
        : typeof req.query.tipo_comida === "string"
        ? req.query.tipo_comida
        : undefined;
    if (mealType && !isMealType(mealType)) {
      throw new AppError("tipoComida invalido.", 400);
    }

    const dayRange = parseDayRange(date);
    const [entries, summary, user] = await Promise.all([
      listNutritionEntriesForDay(userId, dayRange.fromIso, dayRange.toIso, mealType as MealType | undefined),
      getNutritionSummaryForDay(userId, dayRange.fromIso, dayRange.toIso),
      findById(userId),
    ]);

    if (!user) {
      throw new AppError("Usuario no encontrado.", 404);
    }

    const goal = readGoalFromPreferences(user.preferencias);
    const progress =
      goal > 0 ? Math.max(0, Math.min(summary.comidas_registradas / goal, 1)) : 0;

    res.json({
      date: dayRange.date,
      objetivoDiario: goal,
      comidasRegistradas: summary.comidas_registradas,
      progreso: progress,
      resumen: {
        kcal: Number(summary.kcal_total) || 0,
        proteinaG: Number(summary.proteina_total_g) || 0,
        carbohidratosG: Number(summary.carbohidratos_total_g) || 0,
        grasasG: Number(summary.grasas_total_g) || 0,
      },
      historial: entries.map(toNutritionEntry),
      reminderEnabled: readReminderFromPreferences(user.preferencias),
    });
  } catch (error) {
    next(error);
  }
}

export async function listRecentFoods(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const limit = Math.max(1, Math.min(30, Number(req.query.limit) || 10));
    const items = await listRecentFoodTemplatesForUser(userId, limit);
    res.json({
      items: items.map((item) => ({
        alimentoId: item.id_alimento ?? null,
        nombre: item.nombre,
        kcal: Number(item.kcal) || 0,
        proteinaG: item.proteina_g ?? null,
        carbohidratosG: item.carbohidratos_g ?? null,
        grasasG: item.grasas_g ?? null,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function listFrequentFoods(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const limit = Math.max(1, Math.min(30, Number(req.query.limit) || 10));
    const items = await listFrequentFoodTemplatesForUser(userId, limit);
    res.json({
      items: items.map((item) => ({
        alimentoId: item.id_alimento ?? null,
        nombre: item.nombre,
        kcal: Number(item.kcal) || 0,
        proteinaG: item.proteina_g ?? null,
        carbohidratosG: item.carbohidratos_g ?? null,
        grasasG: item.grasas_g ?? null,
        veces: item.veces ?? 0,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function createNutritionEntry(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const tipoComida = body.tipoComida ?? body.tipo_comida;
    if (!isMealType(tipoComida)) {
      throw new AppError("tipoComida invalido.", 400);
    }

    const created = await createNutritionEntryForUser(userId, {
      tipoComida,
      alimentoId: toNumber(body.alimentoId ?? body.id_alimento) ?? null,
      nombre: typeof body.nombre === "string" ? body.nombre : undefined,
      kcal: toNumber(body.kcal),
      proteinaG: toNumber(body.proteinaG ?? body.proteina_g) ?? null,
      carbohidratosG: toNumber(body.carbohidratosG ?? body.carbohidratos_g) ?? null,
      grasasG: toNumber(body.grasasG ?? body.grasas_g) ?? null,
      fRegistro:
        typeof body.fRegistro === "string"
          ? body.fRegistro
          : typeof body.f_registro === "string"
          ? body.f_registro
          : undefined,
    });

    res.status(201).json({ entry: toNutritionEntry(created) });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    if (error instanceof Error) {
      const knownValidation = [
        "Fecha de registro invalida.",
        "El nombre de la comida es requerido.",
        "Las calorias deben ser mayores a 0.",
      ];
      if (knownValidation.includes(error.message)) {
        next(new AppError(error.message, 400));
        return;
      }
    }

    next(error);
  }
}

export async function deleteNutritionEntry(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      throw new AppError("id invalido.", 400);
    }

    const deleted = await deleteNutritionEntryForUser(userId, id);
    if (!deleted) {
      throw new AppError("Registro de comida no encontrado.", 404);
    }

    res.json({ ok: true, entry: toNutritionEntry(deleted) });
  } catch (error) {
    next(error);
  }
}

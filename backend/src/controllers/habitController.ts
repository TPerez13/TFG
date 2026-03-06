import type { Request, Response, NextFunction } from "express";
import type { HabitEntry } from "@muchasvidas/shared";
import { AppError } from "../utils/errors";
import {
  createHabitEntryForUser,
  deleteHabitEntryForUser,
  listEntriesForUser,
} from "../model/habitModel";
import type { HabitEntryRecord } from "../model/habitModel";
import type { AuthRequest } from "../middleware/auth";

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LEGACY_HABIT_QUERY_FIELDS = ["id_tipo_habito"] as const;
const LEGACY_HABIT_BODY_FIELDS = [
  "id_tipo_habito",
  "valor",
  "dateTimeIso",
  "f_registro",
  "unidad",
  "notas",
] as const;

const findLegacyFields = (payload: Record<string, unknown>, fields: readonly string[]): string[] =>
  fields.filter((field) => Object.prototype.hasOwnProperty.call(payload, field));

const parseBoundaryDate = (value: string, boundary: "from" | "to"): Date => {
  if (DATE_ONLY_PATTERN.test(value)) {
    const suffix = boundary === "from" ? "T00:00:00.000Z" : "T23:59:59.999Z";
    return new Date(`${value}${suffix}`);
  }
  return new Date(value);
};

const toHabitEntry = (record: HabitEntryRecord): HabitEntry => ({
  id_registro_habito: record.id_registro_habito,
  id_usuario: record.id_usuario,
  id_tipo_habito: record.id_tipo_habito,
  f_registro: toIsoString(record.f_registro),
  valor: Number(record.valor) || 0,
  unidad: record.unidad ?? null,
  notas: record.notas ?? null,
});

/**
 * GET /api/habits/entries?from=...&to=...
 * Returns habit entries for the authenticated user within a date-time range.
 * The response includes { entries } sorted by registration date.
 */
export async function listEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    console.log("[HABITS] /habits/entries userId:", userId ?? "missing");
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const query = req.query as Record<string, unknown>;
    const legacyQueryFields = findLegacyFields(query, LEGACY_HABIT_QUERY_FIELDS);
    if (legacyQueryFields.length > 0) {
      throw new AppError("Contrato invalido: usa query param typeId.", 400);
    }

    const from = typeof query.from === "string" ? query.from : undefined;
    const to = typeof query.to === "string" ? query.to : undefined;
    const typeId = typeof query.typeId === "string" ? Number(query.typeId) : undefined;
    console.log("[HABITS] range:", { from, to });
    if (!from || !to) {
      throw new AppError("from y to son requeridos.", 400);
    }

    const fromDate = parseBoundaryDate(from, "from");
    const toDate = parseBoundaryDate(to, "to");
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new AppError("from o to invalidos.", 400);
    }

    if (typeof typeId === "number" && (!Number.isFinite(typeId) || typeId <= 0)) {
      throw new AppError("typeId invalido.", 400);
    }

    const records = await listEntriesForUser(
      userId,
      fromDate.toISOString(),
      toDate.toISOString(),
      typeId
    );
    const entries = records.map(toHabitEntry);
    res.json({ entries });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23503"
    ) {
      next(new AppError("typeId no existe en tipo_habito.", 400));
      return;
    }
    next(error);
  }
}

/**
 * POST /api/habits/entries
 * Body: { typeId, value, unit?, dateTime?, notes? }
 */
export async function createEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const legacyBodyFields = findLegacyFields(body, LEGACY_HABIT_BODY_FIELDS);
    if (legacyBodyFields.length > 0) {
      throw new AppError("Contrato invalido: usa body { typeId, value, unit?, dateTime?, notes? }.", 400);
    }

    const typeIdRaw = body.typeId;
    const valueRaw = body.value;
    const dateTimeRaw = body.dateTime;
    const unitRaw = body.unit;
    const notesRaw = body.notes;

    const typeId = Number(typeIdRaw);
    if (!Number.isFinite(typeId) || typeId <= 0) {
      throw new AppError("typeId invalido.", 400);
    }

    const value = Number(valueRaw);
    if (!Number.isFinite(value) || value <= 0) {
      throw new AppError("value invalido.", 400);
    }

    const dateTime =
      typeof dateTimeRaw === "string" && dateTimeRaw.trim() ? new Date(dateTimeRaw) : new Date();
    if (Number.isNaN(dateTime.getTime())) {
      throw new AppError("dateTime invalido.", 400);
    }

    const unit = typeof unitRaw === "string" && unitRaw.trim() ? unitRaw.trim() : null;
    const notes = typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim() : null;

    const created = await createHabitEntryForUser({
      userId,
      typeId,
      value,
      unit,
      notes,
      dateTimeIso: dateTime.toISOString(),
    });

    res.status(201).json({ entry: toHabitEntry(created) });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/habits/entries/:id
 * Deletes an entry for the authenticated user.
 */
export async function deleteEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const entryId = Number(req.params.id);
    if (!Number.isFinite(entryId) || entryId <= 0) {
      throw new AppError("id invalido.", 400);
    }

    const deleted = await deleteHabitEntryForUser(userId, entryId);
    if (!deleted) {
      throw new AppError("Registro no encontrado.", 404);
    }

    res.json({ ok: true, entry: toHabitEntry(deleted) });
  } catch (error) {
    next(error);
  }
}

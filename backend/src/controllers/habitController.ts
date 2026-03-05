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

    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    const typeId =
      typeof req.query.typeId === "string"
        ? Number(req.query.typeId)
        : typeof req.query.id_tipo_habito === "string"
        ? Number(req.query.id_tipo_habito)
        : undefined;
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
    const typeIdRaw = body.typeId ?? body.id_tipo_habito;
    const valueRaw = body.value ?? body.valor;
    const dateTimeRaw = body.dateTime ?? body.dateTimeIso ?? body.f_registro;
    const unitRaw = body.unit ?? body.unidad;
    const notesRaw = body.notes ?? body.notas;

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

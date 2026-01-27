import type { Request, Response, NextFunction } from "express";
import type { HabitEntry } from "@muchasvidas/shared";
import { AppError } from "../utils/errors";
import { listEntriesForUser } from "../model/habitModel";
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

const toHabitEntry = (record: HabitEntryRecord): HabitEntry => ({
  id_registro_habito: record.id_registro_habito,
  id_usuario: record.id_usuario,
  id_tipo_habito: record.id_tipo_habito,
  f_registro: toIsoString(record.f_registro),
  valor: Number(record.valor) || 0,
  unidad: record.unidad ?? null,
  notas: record.notas ?? null,
});

export async function listEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    if (!from || !to) {
      throw new AppError("from y to son requeridos.", 400);
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new AppError("from o to invalidos.", 400);
    }

    const records = await listEntriesForUser(userId, fromDate.toISOString(), toDate.toISOString());
    const entries = records.map(toHabitEntry);
    res.json({ entries });
  } catch (error) {
    next(error);
  }
}

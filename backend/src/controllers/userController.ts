import type { Response, NextFunction } from "express";
import type { HabitEntry, UserDataExport, UserSummary } from "@muchasvidas/shared";
import type { AuthRequest } from "../middleware/auth";
import { AppError } from "../utils/errors";
import { findById, updatePreferences, deleteUserById } from "../model/userModel";
import type { UserRecord } from "../model/userModel";
import { listEntriesForUserExport } from "../model/habitModel";

const toIsoString = (value: unknown): string | undefined => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
};

const toUserSummary = (user: UserRecord): UserSummary => ({
  id: user.id_usuario,
  correo: user.correo,
  nombre: user.nombre,
  preferencias: user.preferencias ?? null,
  f_creacion: toIsoString(user.f_creacion),
});

const toHabitEntry = (record: {
  id_registro_habito: number;
  id_usuario: number;
  id_tipo_habito: number;
  f_registro: string | Date;
  valor: number;
  unidad: string | null;
  notas: string | null;
}): HabitEntry => ({
  id_registro_habito: record.id_registro_habito,
  id_usuario: record.id_usuario,
  id_tipo_habito: record.id_tipo_habito,
  f_registro: toIsoString(record.f_registro) ?? new Date().toISOString(),
  valor: Number(record.valor) || 0,
  unidad: record.unidad ?? null,
  notas: record.notas ?? null,
});

/**
 * GET /api/users/me
 * Returns the authenticated user's summary.
 * Requires a valid Bearer token and replies with { user } on success.
 */
export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId;
    console.log("[USERS] /users/me userId:", userId ?? "missing");
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const user = await findById(userId);
    console.log("[USERS] findById result:", user ? "found" : "null");
    if (!user) {
      throw new AppError("Usuario no encontrado.", 404);
    }

    res.json({ user: toUserSummary(user) });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const preferences = (req.body as { preferencias?: Record<string, unknown> })?.preferencias;
    if (!preferences || typeof preferences !== "object") {
      throw new AppError("Preferencias invalidas.", 400);
    }

    const updated = await updatePreferences(userId, preferences);
    res.json({ preferencias: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/me/export
 * Returns a basic JSON export with profile and recent habit entries.
 */
export async function exportMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const user = await findById(userId);
    if (!user) {
      throw new AppError("Usuario no encontrado.", 404);
    }

    const entries = await listEntriesForUserExport(userId);
    const payload: UserDataExport = {
      generatedAt: new Date().toISOString(),
      user: toUserSummary(user),
      habits: entries.map(toHabitEntry),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=\"muchasvidas-export.json\"");
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/me
 * Deletes the authenticated account and related data (cascade).
 */
export async function deleteMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const deleted = await deleteUserById(userId);
    if (!deleted) {
      throw new AppError("Usuario no encontrado.", 404);
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

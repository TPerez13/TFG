import type { Response, NextFunction } from "express";
import type { UserSummary } from "@muchasvidas/shared";
import type { AuthRequest } from "../middleware/auth";
import { AppError } from "../utils/errors";
import { findById, updatePreferences } from "../model/userModel";
import type { UserRecord } from "../model/userModel";

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

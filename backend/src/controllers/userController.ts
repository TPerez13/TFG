import bcrypt from "bcryptjs";
import type { Response, NextFunction } from "express";
import type { HabitEntry, Notification, UserDataExport, UserSummary } from "@muchasvidas/shared";
import type { AuthRequest } from "../middleware/auth";
import { AppError } from "../utils/errors";
import {
  findById,
  updatePreferences,
  deleteUserById,
  updateUserProfile,
  updatePasswordHash,
} from "../model/userModel";
import type { UserRecord } from "../model/userModel";
import { listEntriesForUserExport } from "../model/habitModel";
import { listNotifications } from "../model/notificationModel";

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

const toNotification = (record: {
  id_notificacion: number;
  id_usuario: number;
  titulo: string;
  cuerpo: string;
  tipo: "REMINDER" | "ACHIEVEMENT" | "CHALLENGE" | "SYSTEM";
  leida: boolean;
  f_leida: string | Date | null;
  f_programada: string | Date | null;
  f_envio: string | Date | null;
  estado: string | null;
  metadatos: Record<string, unknown> | null;
  deep_link: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}): Notification => ({
  id: record.id_notificacion,
  userId: record.id_usuario,
  title: record.titulo,
  body: record.cuerpo,
  type: record.tipo,
  read: record.leida,
  readAt: toIsoString(record.f_leida) ?? null,
  scheduledAt: toIsoString(record.f_programada) ?? null,
  sentAt: toIsoString(record.f_envio) ?? null,
  status: record.estado ?? null,
  metadata: record.metadatos ?? null,
  deepLink: record.deep_link ?? null,
  createdAt: toIsoString(record.created_at) ?? new Date().toISOString(),
  updatedAt: toIsoString(record.updated_at) ?? new Date().toISOString(),
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

    const payload = (req.body as {
      preferencias?: Record<string, unknown>;
      nombre?: string;
      correo?: string;
    }) ?? {};

    const hasPreferences = Object.prototype.hasOwnProperty.call(payload, "preferencias");
    const hasNombre = Object.prototype.hasOwnProperty.call(payload, "nombre");
    const hasCorreo = Object.prototype.hasOwnProperty.call(payload, "correo");

    if (!hasPreferences && !hasNombre && !hasCorreo) {
      throw new AppError("Debes enviar al menos un campo para actualizar.", 400);
    }

    const existing = await findById(userId);
    if (!existing) {
      throw new AppError("Usuario no encontrado.", 404);
    }

    let nextNombre: string | undefined;
    if (hasNombre) {
      if (typeof payload.nombre !== "string" || payload.nombre.trim().length === 0) {
        throw new AppError("Nombre invalido.", 400);
      }
      nextNombre = payload.nombre.trim();
    }

    let nextCorreo: string | undefined;
    if (hasCorreo) {
      if (typeof payload.correo !== "string" || payload.correo.trim().length === 0) {
        throw new AppError("Correo invalido.", 400);
      }
      nextCorreo = payload.correo.trim();
    }

    let nextPreferences: Record<string, unknown> | undefined;
    if (hasPreferences) {
      const preferences = payload.preferencias;
      if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) {
        throw new AppError("Preferencias invalidas.", 400);
      }
      nextPreferences = preferences;
    }

    let updatedUser = existing;

    if (hasNombre || hasCorreo) {
      try {
        const profileUpdated = await updateUserProfile(userId, {
          nombre: nextNombre,
          correo: nextCorreo,
        });
        if (!profileUpdated) {
          throw new AppError("Usuario no encontrado.", 404);
        }
        updatedUser = profileUpdated;
      } catch (error: any) {
        if (error?.code === "23505") {
          throw new AppError("El correo ya esta registrado.", 409);
        }
        throw error;
      }
    }

    if (nextPreferences) {
      const mergedPreferences = await updatePreferences(userId, nextPreferences);
      updatedUser = { ...updatedUser, preferencias: mergedPreferences };
    }

    res.json({ user: toUserSummary(updatedUser), preferencias: updatedUser.preferencias ?? null });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const payload = (req.body as { currentPassword?: string; newPassword?: string }) ?? {};
    const currentPassword = typeof payload.currentPassword === "string" ? payload.currentPassword : "";
    const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

    if (!currentPassword || !newPassword) {
      throw new AppError("Contrasena actual y nueva contrasena son requeridas.", 400);
    }

    if (newPassword.length < 6) {
      throw new AppError("La nueva contrasena debe tener al menos 6 caracteres.", 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError("La nueva contrasena debe ser diferente a la actual.", 400);
    }

    const user = await findById(userId);
    if (!user) {
      throw new AppError("Usuario no encontrado.", 404);
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.hash_clave);
    if (!isCurrentValid) {
      throw new AppError("La contrasena actual es incorrecta.", 401);
    }

    const hash = await bcrypt.hash(newPassword, 10);
    const updated = await updatePasswordHash(userId, hash);
    if (!updated) {
      throw new AppError("Usuario no encontrado.", 404);
    }

    res.json({ message: "Contrasena actualizada correctamente." });
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
    const notificationRecords = await listNotifications({ userId, limit: 200 });
    const payload: UserDataExport = {
      generatedAt: new Date().toISOString(),
      user: toUserSummary(user),
      habits: entries.map(toHabitEntry),
    };
    (payload as UserDataExport & { notifications: Notification[] }).notifications =
      notificationRecords.map(toNotification);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=\"trackhabit-loop-export.json\"");
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

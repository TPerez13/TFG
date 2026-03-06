import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { AppError } from "../utils/errors";
import {
  countUnread,
  deleteNotification,
  listNotifications,
  updateReadStatus,
  markAllRead,
  getNotificationById,
} from "../model/notificationModel";
import type { NotificationType } from "../model/notificationModel";
import { seedNotificationsForUser } from "../service/notificationService";

const toIsoString = (value: unknown): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value);
};

const toDto = (record: {
  id_notificacion: number;
  id_usuario: number;
  titulo: string;
  cuerpo: string;
  tipo: NotificationType;
  leida: boolean;
  f_leida: string | Date | null;
  f_programada: string | Date | null;
  f_envio: string | Date | null;
  estado: string | null;
  metadatos: Record<string, unknown> | null;
  deep_link: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}) => ({
  id: record.id_notificacion,
  userId: record.id_usuario,
  title: record.titulo,
  body: record.cuerpo,
  type: record.tipo,
  read: record.leida,
  readAt: toIsoString(record.f_leida),
  scheduledAt: toIsoString(record.f_programada),
  sentAt: toIsoString(record.f_envio),
  status: record.estado,
  metadata: record.metadatos ?? null,
  deepLink: record.deep_link ?? null,
  createdAt: toIsoString(record.created_at) ?? new Date().toISOString(),
  updatedAt: toIsoString(record.updated_at) ?? new Date().toISOString(),
});

const parseLimit = (value: unknown, fallback: number) => {
  if (typeof value !== "string") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : Math.min(Math.max(parsed, 1), 50);
};

const parseBoolean = (value: unknown) => {
  if (typeof value === "string") {
    return value === "true" || value === "1";
  }
  if (typeof value === "boolean") return value;
  return undefined;
};

const normalizeType = (value: unknown): NotificationType | undefined => {
  if (typeof value !== "string") return undefined;
  const upper = value.toUpperCase();
  if (upper === "REMINDER" || upper === "ACHIEVEMENT" || upper === "CHALLENGE" || upper === "SYSTEM") {
    return upper as NotificationType;
  }
  return undefined;
};

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) throw new AppError("Token invalido.", 401);

    const limit = parseLimit(req.query.limit, 20);
    const cursorRaw = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    let cursor: string | undefined;
    if (cursorRaw) {
      const parsed = new Date(cursorRaw);
      if (Number.isNaN(parsed.getTime())) {
        throw new AppError("Cursor invalido.", 400);
      }
      cursor = parsed.toISOString();
    }
    const type = normalizeType(req.query.type);
    const unreadOnly = parseBoolean(req.query.unreadOnly) ?? false;

    const items = await listNotifications({ userId, limit, cursor, type, unreadOnly });
    const nextCursor = items.length === limit ? toIsoString(items[items.length - 1].created_at) : null;
    res.json({ items: items.map(toDto), nextCursor });
  } catch (error) {
    next(error);
  }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) throw new AppError("Token invalido.", 401);
    const count = await countUnread(userId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
}

export async function updateRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) throw new AppError("Token invalido.", 401);

    const notificationId = Number(req.params.id);
    if (!notificationId) throw new AppError("ID invalido.", 400);

    const rawRead = (req.body as { read?: boolean })?.read;
    if (typeof rawRead !== "boolean") {
      throw new AppError("Campo read invalido.", 400);
    }
    const read = rawRead;
    const updated = await updateReadStatus(userId, notificationId, read);
    if (!updated) throw new AppError("Notificacion no encontrada.", 404);
    res.json({ item: toDto(updated) });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) throw new AppError("Token invalido.", 401);

    const notificationId = Number(req.params.id);
    if (!notificationId) throw new AppError("ID invalido.", 400);

    const item = await getNotificationById(userId, notificationId);
    if (!item) throw new AppError("Notificacion no encontrada.", 404);
    res.json({ item: toDto(item) });
  } catch (error) {
    next(error);
  }
}

export async function readAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) throw new AppError("Token invalido.", 401);

    const updated = await markAllRead(userId);
    res.json({ updated });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) throw new AppError("Token invalido.", 401);

    const notificationId = Number(req.params.id);
    if (!notificationId) throw new AppError("ID invalido.", 400);

    const deleted = await deleteNotification(userId, notificationId);
    if (!deleted) throw new AppError("Notificacion no encontrada.", 404);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function seed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) throw new AppError("Token invalido.", 401);
    await seedNotificationsForUser(userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

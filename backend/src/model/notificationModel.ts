import { pool } from "../db";

export type NotificationType = "REMINDER" | "ACHIEVEMENT" | "CHALLENGE" | "SYSTEM";

export interface NotificationRecord {
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
}

export type ListNotificationsInput = {
  userId: number;
  limit: number;
  cursor?: string;
  type?: NotificationType;
  unreadOnly?: boolean;
};

export async function listNotifications(input: ListNotificationsInput): Promise<NotificationRecord[]> {
  const params: Array<string | number | boolean> = [input.userId];
  let idx = 2;
  const conditions: string[] = ["id_usuario = $1"];

  if (input.type) {
    conditions.push(`tipo = $${idx++}`);
    params.push(input.type);
  }

  if (input.unreadOnly) {
    conditions.push("leida = false");
  }

  if (input.cursor) {
    conditions.push(`created_at < $${idx++}`);
    params.push(input.cursor);
  }

  params.push(input.limit);

  const query = `
    SELECT id_notificacion,
           id_usuario,
           titulo,
           cuerpo,
           tipo,
           leida,
           f_leida,
           f_programada,
           f_envio,
           estado,
           metadatos,
           deep_link,
           created_at,
           updated_at
      FROM notificacion
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC, id_notificacion DESC
     LIMIT $${idx}
  `;

  const result = await pool.query<NotificationRecord>(query, params);
  return result.rows;
}

export async function countUnread(userId: number): Promise<number> {
  const result = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::int AS count FROM notificacion WHERE id_usuario = $1 AND leida = false",
    [userId]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function updateReadStatus(
  userId: number,
  notificationId: number,
  read: boolean
): Promise<NotificationRecord | null> {
  const result = await pool.query<NotificationRecord>(
    `UPDATE notificacion
        SET leida = $1,
            f_leida = CASE WHEN $1 THEN now() ELSE NULL END,
            updated_at = now()
      WHERE id_notificacion = $2 AND id_usuario = $3
      RETURNING id_notificacion,
                id_usuario,
                titulo,
                cuerpo,
                tipo,
                leida,
                f_leida,
                f_programada,
                f_envio,
                estado,
                metadatos,
                deep_link,
                created_at,
                updated_at`,
    [read, notificationId, userId]
  );

  return result.rowCount ? result.rows[0] : null;
}

export async function markAllRead(userId: number): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `UPDATE notificacion
        SET leida = true,
            f_leida = COALESCE(f_leida, now()),
            updated_at = now()
      WHERE id_usuario = $1 AND leida = false`,
    [userId]
  );
  return result.rowCount ?? 0;
}

export async function deleteNotification(userId: number, notificationId: number): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM notificacion WHERE id_notificacion = $1 AND id_usuario = $2",
    [notificationId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getNotificationById(
  userId: number,
  notificationId: number
): Promise<NotificationRecord | null> {
  const result = await pool.query<NotificationRecord>(
    `SELECT id_notificacion,
            id_usuario,
            titulo,
            cuerpo,
            tipo,
            leida,
            f_leida,
            f_programada,
            f_envio,
            estado,
            metadatos,
            deep_link,
            created_at,
            updated_at
       FROM notificacion
      WHERE id_notificacion = $1 AND id_usuario = $2`,
    [notificationId, userId]
  );

  return result.rowCount ? result.rows[0] : null;
}

export type CreateNotificationInput = {
  userId: number;
  title: string;
  body: string;
  type: NotificationType;
  metadata?: Record<string, unknown> | null;
  deepLink?: string | null;
  scheduledAt?: string | null;
};

export async function createNotification(input: CreateNotificationInput): Promise<NotificationRecord> {
  const result = await pool.query<NotificationRecord>(
    `INSERT INTO notificacion
      (id_usuario, titulo, cuerpo, tipo, leida, metadatos, deep_link, f_programada, estado)
     VALUES
      ($1, $2, $3, $4, false, $5, $6, $7, 'programada')
     RETURNING id_notificacion,
               id_usuario,
               titulo,
               cuerpo,
               tipo,
               leida,
               f_leida,
               f_programada,
               f_envio,
               estado,
               metadatos,
               deep_link,
               created_at,
               updated_at`,
    [
      input.userId,
      input.title,
      input.body,
      input.type,
      input.metadata ?? null,
      input.deepLink ?? null,
      input.scheduledAt ?? null,
    ]
  );

  return result.rows[0];
}

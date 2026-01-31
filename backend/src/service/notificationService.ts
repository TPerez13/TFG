import type { NotificationType } from "../model/notificationModel";
import { createNotification } from "../model/notificationModel";

const sampleBodies: Record<NotificationType, string[]> = {
  REMINDER: [
    "Hora de hidratarse. Un vaso mas y sigues sumando.",
    "Tu recordatorio diario esta listo. Mantente constante.",
  ],
  ACHIEVEMENT: [
    "Has desbloqueado un nuevo logro. Gran trabajo.",
    "Meta cumplida. Sigue elevando tu progreso.",
  ],
  CHALLENGE: [
    "Nuevo reto disponible. Aceptalo y gana puntos.",
    "Un desafio te espera. Mira los detalles en la app.",
  ],
  SYSTEM: [
    "Actualizamos tu panel con nuevas mejoras.",
    "Tu cuenta esta al dia. Gracias por seguir.",
  ],
};

export async function createNotificationForUser(
  userId: number,
  type: NotificationType,
  title: string,
  body?: string
) {
  return createNotification({
    userId,
    type,
    title,
    body: body ?? sampleBodies[type][0],
  });
}

export async function seedNotificationsForUser(userId: number) {
  const types: NotificationType[] = ["REMINDER", "ACHIEVEMENT", "CHALLENGE", "SYSTEM"];
  const tasks = Array.from({ length: 12 }).map((_, idx) => {
    const type = types[idx % types.length];
    const body = sampleBodies[type][idx % sampleBodies[type].length];
    const title =
      type === "REMINDER"
        ? "Recordatorio de habitos"
        : type === "ACHIEVEMENT"
        ? "Logro desbloqueado"
        : type === "CHALLENGE"
        ? "Nuevo reto"
        : "Novedad del sistema";
    return createNotification({ userId, type, title, body });
  });

  await Promise.all(tasks);
}

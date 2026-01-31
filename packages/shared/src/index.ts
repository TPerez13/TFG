export type UserSummary = {
  id: number;
  username?: string;
  correo?: string;
  nombre?: string;
  preferencias?: Record<string, unknown> | null;
  f_creacion?: string;
};

export type User = UserSummary;

export type LoginRequest = {
  correo?: string;
  username?: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: UserSummary;
  token?: string;
};

export type RegisterRequest = {
  correo: string;
  nombre: string;
  password: string;
  preferencias?: Record<string, unknown> | null;
};

export type RegisterResponse = {
  message: string;
  user: UserSummary;
  token?: string;
};

export type HabitEntry = {
  id_registro_habito: number;
  id_usuario: number;
  id_tipo_habito: number;
  f_registro: string;
  valor: number;
  unidad: string | null;
  notas: string | null;
};

export type HabitSummary = {
  id_tipo_habito: number;
  total: number;
  meta: number;
  progreso: number;
  unidad?: string | null;
};

export type NotificationType = "REMINDER" | "ACHIEVEMENT" | "CHALLENGE" | "SYSTEM";

export type Notification = {
  id: number;
  userId: number;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  readAt?: string | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
  deepLink?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationSettings = {
  enabled: boolean;
  reminders: boolean;
  achievements: boolean;
  challenges: boolean;
  system: boolean;
};

export type NotificationListResponse = {
  items: Notification[];
  nextCursor: string | null;
};

export type NotificationUnreadCountResponse = {
  count: number;
};

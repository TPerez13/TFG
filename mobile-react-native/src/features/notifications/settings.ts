import type { HabitNotificationKey, NotificationSettings } from './types';

const HABIT_KEYS: HabitNotificationKey[] = [
  'hidratacion',
  'nutricion',
  'ejercicio',
  'sueno',
  'meditacion',
];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  global: {
    enabled: true,
    summaryTime: '08:00',
    quietHoursEnabled: false,
    quietFrom: '22:00',
    quietTo: '07:00',
  },
  habits: {
    hidratacion: { enabled: true, time: '10:00', lastCompletedDate: null },
    nutricion: { enabled: true, time: '13:00', lastCompletedDate: null },
    ejercicio: { enabled: true, time: '20:00', lastCompletedDate: null },
    sueno: { enabled: true, time: '22:00', lastCompletedDate: null },
    meditacion: { enabled: true, time: '20:00', lastCompletedDate: null },
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const parseBool = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const parseTime = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return TIME_PATTERN.test(trimmed) ? trimmed : undefined;
};

const parseDate = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  return DATE_PATTERN.test(value) ? value : undefined;
};

const cloneDefaults = (): NotificationSettings =>
  JSON.parse(JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS)) as NotificationSettings;

const readLegacyHabitEnabled = (
  rawNotifications: Record<string, unknown>,
  key: HabitNotificationKey
): boolean | undefined => {
  switch (key) {
    case 'hidratacion':
      return parseBool(rawNotifications.hidratacion) ?? parseBool(rawNotifications.hydration);
    case 'nutricion':
      return parseBool(rawNotifications.nutricion) ?? parseBool(rawNotifications.nutrition);
    case 'ejercicio':
      return parseBool(rawNotifications.ejercicio) ?? parseBool(rawNotifications.exercise);
    case 'sueno':
      return parseBool(rawNotifications.sueno) ?? parseBool(rawNotifications.sleep);
    case 'meditacion':
      return parseBool(rawNotifications.meditacion) ?? parseBool(rawNotifications.meditation);
    default:
      return undefined;
  }
};

export const isValidTimeValue = (value: string): boolean => TIME_PATTERN.test(value.trim());

export const normalizeNotificationSettingsFromPreferences = (preferences: unknown): NotificationSettings => {
  const normalized = cloneDefaults();
  if (!isRecord(preferences)) return normalized;

  const rawNotifications = isRecord(preferences.notificaciones)
    ? (preferences.notificaciones as Record<string, unknown>)
    : {};
  const rawGlobal = isRecord(rawNotifications.global)
    ? (rawNotifications.global as Record<string, unknown>)
    : {};
  const rawHabits = isRecord(rawNotifications.habits)
    ? (rawNotifications.habits as Record<string, unknown>)
    : {};
  const rawQuietHours = isRecord(preferences.quiet_hours)
    ? (preferences.quiet_hours as Record<string, unknown>)
    : {};
  const rawNutrition = isRecord(preferences.nutricion)
    ? (preferences.nutricion as Record<string, unknown>)
    : {};

  const globalEnabled =
    parseBool(rawGlobal.enabled) ??
    parseBool(rawNotifications.enabled) ??
    parseBool(rawNotifications.habilitadas);
  if (typeof globalEnabled === 'boolean') {
    normalized.global.enabled = globalEnabled;
  }

  const summaryTime =
    parseTime(rawGlobal.summaryTime) ??
    parseTime(rawNotifications.summaryTime) ??
    parseTime(rawNotifications.weeklyTime);
  if (summaryTime) {
    normalized.global.summaryTime = summaryTime;
  }

  const quietHoursEnabled =
    parseBool(rawGlobal.quietHoursEnabled) ?? parseBool(rawNotifications.quietHoursEnabled);
  if (typeof quietHoursEnabled === 'boolean') {
    normalized.global.quietHoursEnabled = quietHoursEnabled;
  }

  const quietFrom =
    parseTime(rawGlobal.quietFrom) ??
    parseTime(rawNotifications.quietFrom) ??
    parseTime(rawQuietHours.desde);
  if (quietFrom) {
    normalized.global.quietFrom = quietFrom;
  }

  const quietTo =
    parseTime(rawGlobal.quietTo) ??
    parseTime(rawNotifications.quietTo) ??
    parseTime(rawQuietHours.hasta);
  if (quietTo) {
    normalized.global.quietTo = quietTo;
  }

  for (const key of HABIT_KEYS) {
    const rawHabit = isRecord(rawHabits[key]) ? (rawHabits[key] as Record<string, unknown>) : {};
    const enabled =
      parseBool(rawHabit.enabled) ??
      readLegacyHabitEnabled(rawNotifications, key) ??
      (key === 'nutricion' ? parseBool(rawNutrition.recordatoriosComidas) : undefined);
    if (typeof enabled === 'boolean') {
      normalized.habits[key].enabled = enabled;
    }

    const time = parseTime(rawHabit.time);
    if (time) {
      normalized.habits[key].time = time;
    }

    const lastCompletedDate = parseDate(rawHabit.lastCompletedDate);
    if (lastCompletedDate !== undefined) {
      normalized.habits[key].lastCompletedDate = lastCompletedDate;
    }
  }

  return normalized;
};

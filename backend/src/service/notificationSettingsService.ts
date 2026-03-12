import type {
  HabitNotificationKey,
  NotificationSettings,
  NotificationSettingsPatch,
} from "@muchasvidas/shared";
import { findById, updatePreferences } from "../model/userModel";
import { AppError } from "../utils/errors";

const HABIT_KEYS: HabitNotificationKey[] = [
  "hidratacion",
  "nutricion",
  "ejercicio",
  "sueno",
  "meditacion",
];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  global: {
    enabled: true,
    summaryTime: "08:00",
    quietHoursEnabled: false,
    quietFrom: "22:00",
    quietTo: "07:00",
  },
  habits: {
    hidratacion: { enabled: true, time: "10:00", lastCompletedDate: null },
    nutricion: { enabled: true, time: "13:00", lastCompletedDate: null },
    ejercicio: { enabled: true, time: "20:00", lastCompletedDate: null },
    sueno: { enabled: true, time: "22:00", lastCompletedDate: null },
    meditacion: { enabled: true, time: "20:00", lastCompletedDate: null },
  },
};

const TYPE_ID_TO_HABIT_KEY: Record<number, HabitNotificationKey> = {
  1: "hidratacion",
  2: "nutricion",
  3: "ejercicio",
  4: "sueno",
  5: "meditacion",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const parseBool = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const parseTime = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return TIME_PATTERN.test(trimmed) ? trimmed : undefined;
};

const parseDateKey = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return DATE_PATTERN.test(value) ? value : undefined;
};

const asDateKey = (isoDate?: string): string => {
  if (!isoDate) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

const cloneDefaults = (): NotificationSettings =>
  JSON.parse(JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS)) as NotificationSettings;

const readLegacyHabitEnabled = (
  rawNotifications: Record<string, unknown>,
  key: HabitNotificationKey
): boolean | undefined => {
  switch (key) {
    case "hidratacion":
      return parseBool(rawNotifications.hidratacion) ?? parseBool(rawNotifications.hydration);
    case "nutricion":
      return parseBool(rawNotifications.nutricion) ?? parseBool(rawNotifications.nutrition);
    case "ejercicio":
      return parseBool(rawNotifications.ejercicio) ?? parseBool(rawNotifications.exercise);
    case "sueno":
      return parseBool(rawNotifications.sueno) ?? parseBool(rawNotifications.sleep);
    case "meditacion":
      return parseBool(rawNotifications.meditacion) ?? parseBool(rawNotifications.meditation);
    default:
      return undefined;
  }
};

const assertTime = (value: unknown, fieldName: string): string => {
  const parsed = parseTime(value);
  if (!parsed) {
    throw new AppError(`${fieldName} invalido. Usa formato HH:MM.`, 400);
  }
  return parsed;
};

const normalizePatch = (value: unknown): NotificationSettingsPatch => {
  if (!isRecord(value)) return {};
  const patch = value as NotificationSettingsPatch;
  return patch;
};

export const getDefaultNotificationSettings = (): NotificationSettings => cloneDefaults();

export const resolveHabitKeyFromTypeId = (typeId: number): HabitNotificationKey | null =>
  TYPE_ID_TO_HABIT_KEY[typeId] ?? null;

export function normalizeNotificationSettingsFromPreferences(preferences: unknown): NotificationSettings {
  const normalized = cloneDefaults();
  if (!isRecord(preferences)) return normalized;

  const prefs = preferences as Record<string, unknown>;
  const rawNotifications = isRecord(prefs.notificaciones)
    ? (prefs.notificaciones as Record<string, unknown>)
    : {};
  const rawGlobal = isRecord(rawNotifications.global)
    ? (rawNotifications.global as Record<string, unknown>)
    : {};
  const rawHabits = isRecord(rawNotifications.habits)
    ? (rawNotifications.habits as Record<string, unknown>)
    : {};
  const rawUserQuietHours = isRecord(prefs.quiet_hours)
    ? (prefs.quiet_hours as Record<string, unknown>)
    : {};
  const rawNutrition = isRecord(prefs.nutricion) ? (prefs.nutricion as Record<string, unknown>) : {};

  const globalEnabled =
    parseBool(rawGlobal.enabled) ??
    parseBool(rawNotifications.enabled) ??
    parseBool(rawNotifications.habilitadas);
  if (typeof globalEnabled === "boolean") {
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
  if (typeof quietHoursEnabled === "boolean") {
    normalized.global.quietHoursEnabled = quietHoursEnabled;
  }

  const quietFrom =
    parseTime(rawGlobal.quietFrom) ??
    parseTime(rawNotifications.quietFrom) ??
    parseTime(rawUserQuietHours.desde);
  if (quietFrom) {
    normalized.global.quietFrom = quietFrom;
  }

  const quietTo =
    parseTime(rawGlobal.quietTo) ??
    parseTime(rawNotifications.quietTo) ??
    parseTime(rawUserQuietHours.hasta);
  if (quietTo) {
    normalized.global.quietTo = quietTo;
  }

  for (const key of HABIT_KEYS) {
    const habitDefaults = normalized.habits[key];
    const rawHabit = isRecord(rawHabits[key]) ? (rawHabits[key] as Record<string, unknown>) : {};

    const enabledFromHabitObject = parseBool(rawHabit.enabled);
    const enabledFromLegacyRoot = readLegacyHabitEnabled(rawNotifications, key);
    const enabledFromLegacyNutrition =
      key === "nutricion" ? parseBool(rawNutrition.recordatoriosComidas) : undefined;
    const resolvedEnabled = enabledFromHabitObject ?? enabledFromLegacyRoot ?? enabledFromLegacyNutrition;
    if (typeof resolvedEnabled === "boolean") {
      habitDefaults.enabled = resolvedEnabled;
    }

    const resolvedTime = parseTime(rawHabit.time);
    if (resolvedTime) {
      habitDefaults.time = resolvedTime;
    }

    const completedDate = parseDateKey(rawHabit.lastCompletedDate);
    if (completedDate !== undefined) {
      habitDefaults.lastCompletedDate = completedDate;
    }
  }

  return normalized;
}

function applyPatch(
  current: NotificationSettings,
  rawPatch: NotificationSettingsPatch
): NotificationSettings {
  const next = JSON.parse(JSON.stringify(current)) as NotificationSettings;
  const patch = normalizePatch(rawPatch);

  if (patch.global !== undefined) {
    if (!isRecord(patch.global)) {
      throw new AppError("global invalido.", 400);
    }
    const globalPatch = patch.global as Record<string, unknown>;
    const enabled = parseBool(globalPatch.enabled);
    if (typeof enabled === "boolean") {
      next.global.enabled = enabled;
    }

    if (Object.prototype.hasOwnProperty.call(globalPatch, "summaryTime")) {
      next.global.summaryTime = assertTime(globalPatch.summaryTime, "summaryTime");
    }

    const quietEnabled = parseBool(globalPatch.quietHoursEnabled);
    if (typeof quietEnabled === "boolean") {
      next.global.quietHoursEnabled = quietEnabled;
    }

    if (Object.prototype.hasOwnProperty.call(globalPatch, "quietFrom")) {
      next.global.quietFrom = assertTime(globalPatch.quietFrom, "quietFrom");
    }

    if (Object.prototype.hasOwnProperty.call(globalPatch, "quietTo")) {
      next.global.quietTo = assertTime(globalPatch.quietTo, "quietTo");
    }
  }

  if (patch.habits !== undefined) {
    if (!isRecord(patch.habits)) {
      throw new AppError("habits invalido.", 400);
    }

    for (const [habitKey, partial] of Object.entries(patch.habits)) {
      if (!HABIT_KEYS.includes(habitKey as HabitNotificationKey)) {
        throw new AppError(`Habit no soportado: ${habitKey}.`, 400);
      }
      if (!isRecord(partial)) {
        throw new AppError(`Configuracion invalida para ${habitKey}.`, 400);
      }

      const typedKey = habitKey as HabitNotificationKey;
      const enabled = parseBool(partial.enabled);
      if (typeof enabled === "boolean") {
        next.habits[typedKey].enabled = enabled;
      }

      if (Object.prototype.hasOwnProperty.call(partial, "time")) {
        next.habits[typedKey].time = assertTime(partial.time, `habits.${typedKey}.time`);
      }

      if (Object.prototype.hasOwnProperty.call(partial, "lastCompletedDate")) {
        const parsedDate = parseDateKey(partial.lastCompletedDate);
        if (parsedDate === undefined) {
          throw new AppError(
            `habits.${typedKey}.lastCompletedDate invalido. Usa YYYY-MM-DD o null.`,
            400
          );
        }
        next.habits[typedKey].lastCompletedDate = parsedDate;
      }
    }
  }

  return next;
}

export async function getNotificationSettingsForUser(userId: number): Promise<NotificationSettings> {
  const user = await findById(userId);
  if (!user) {
    throw new AppError("Usuario no encontrado.", 404);
  }
  return normalizeNotificationSettingsFromPreferences(user.preferencias);
}

export async function patchNotificationSettingsForUser(
  userId: number,
  patch: NotificationSettingsPatch
): Promise<NotificationSettings> {
  const user = await findById(userId);
  if (!user) {
    throw new AppError("Usuario no encontrado.", 404);
  }

  const current = normalizeNotificationSettingsFromPreferences(user.preferencias);
  const nextSettings = applyPatch(current, patch);
  const updatedPreferences = await updatePreferences(userId, {
    notificaciones: nextSettings as unknown as Record<string, unknown>,
  });

  return normalizeNotificationSettingsFromPreferences(updatedPreferences);
}

export async function markHabitRecordedToday(
  userId: number,
  habitKey: HabitNotificationKey,
  dateTimeIso?: string
): Promise<void> {
  await patchNotificationSettingsForUser(userId, {
    habits: {
      [habitKey]: {
        lastCompletedDate: asDateKey(dateTimeIso),
      },
    },
  });
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type {
  HabitNotificationKey,
  HabitReminderDebugInfo,
  HabitReminderSnapshot,
  NotificationSettings,
} from './types';
import { DEFAULT_NOTIFICATION_SETTINGS } from './settings';
import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
  setNotificationChannelAsync,
  setNotificationHandler,
} from './expoNotificationsCompat';
import type { NotificationRequest, NotificationTriggerInput } from './expoNotificationsCompat';

type NotificationGlobalSettings = NotificationSettings['global'];
type NotificationHabitSettings = NotificationSettings['habits'][HabitNotificationKey];

type ScheduledByHabit = Partial<Record<HabitNotificationKey, string>>;
type ScheduledMetaByHabit = Partial<Record<HabitNotificationKey, { identifier: string; scheduledAt: string }>>;

const STORAGE_KEY = '@mv2/local_habit_notification_ids_v1';
const META_STORAGE_KEY = '@mv2/local_habit_notification_meta_v1';
const MANAGED_SOURCE = 'habit_mvp';
const ANDROID_CHANNEL_ID = 'habit-reminders-v2';

const HABIT_KEYS: HabitNotificationKey[] = [
  'hidratacion',
  'nutricion',
  'ejercicio',
  'sueno',
  'meditacion',
];

const HABIT_CONTENT: Record<HabitNotificationKey, { title: string; body: string }> = {
  hidratacion: {
    title: 'Recordatorio de hidratacion',
    body: 'Aun puedes sumar agua hoy. Registra tu siguiente vaso.',
  },
  nutricion: {
    title: 'Recordatorio de nutricion',
    body: 'Revisa tus comidas de hoy y registra lo pendiente.',
  },
  ejercicio: {
    title: 'Recordatorio de ejercicio',
    body: 'Aun hay tiempo para completar tu actividad de hoy.',
  },
  sueno: {
    title: 'Recordatorio de sueno',
    body: 'Prepara tu descanso y registra tus horas de sueno.',
  },
  meditacion: {
    title: 'Recordatorio de meditacion',
    body: 'Toma unos minutos para meditar y registrarlo.',
  },
};

let runtimeConfigured = false;

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined';

const hasHabitKey = (value: unknown): value is HabitNotificationKey =>
  typeof value === 'string' && HABIT_KEYS.includes(value as HabitNotificationKey);

const parseTime = (value: string): { hour: number; minute: number } | null => {
  const trimmed = value.trim();
  const match = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
};

const DEFAULT_HABIT_TIMES: Record<HabitNotificationKey, { hour: number; minute: number }> = {
  hidratacion: parseTime(DEFAULT_NOTIFICATION_SETTINGS.habits.hidratacion.time) ?? { hour: 10, minute: 0 },
  nutricion: parseTime(DEFAULT_NOTIFICATION_SETTINGS.habits.nutricion.time) ?? { hour: 13, minute: 0 },
  ejercicio: parseTime(DEFAULT_NOTIFICATION_SETTINGS.habits.ejercicio.time) ?? { hour: 20, minute: 0 },
  sueno: parseTime(DEFAULT_NOTIFICATION_SETTINGS.habits.sueno.time) ?? { hour: 22, minute: 0 },
  meditacion: parseTime(DEFAULT_NOTIFICATION_SETTINGS.habits.meditacion.time) ?? { hour: 20, minute: 0 },
};

const toMinutes = (hour: number, minute: number) => hour * 60 + minute;

const localDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const wasCompletedToday = (lastCompletedDate: string | null | undefined, now: Date) => {
  if (!lastCompletedDate) return false;
  return lastCompletedDate === localDateKey(now) || lastCompletedDate === now.toISOString().slice(0, 10);
};

const isWithinQuietRange = (valueMin: number, quietFromMin: number, quietToMin: number) => {
  if (quietFromMin === quietToMin) return false;
  if (quietFromMin < quietToMin) {
    return valueMin >= quietFromMin && valueMin < quietToMin;
  }
  return valueMin >= quietFromMin || valueMin < quietToMin;
};

const getManagedHabitFromRequest = (
  request: NotificationRequest
): HabitNotificationKey | null => {
  const data = (request.content.data ?? {}) as Record<string, unknown>;
  if (data.source !== MANAGED_SOURCE) return null;
  return hasHabitKey(data.habitKey) ? data.habitKey : null;
};

const readScheduledByHabit = async (): Promise<ScheduledByHabit> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: ScheduledByHabit = {};
    for (const key of HABIT_KEYS) {
      const identifier = parsed[key];
      if (typeof identifier === 'string') {
        result[key] = identifier;
      }
    }
    return result;
  } catch {
    return {};
  }
};

const writeScheduledByHabit = async (value: ScheduledByHabit): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const readScheduledMetaByHabit = async (): Promise<ScheduledMetaByHabit> => {
  try {
    const raw = await AsyncStorage.getItem(META_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: ScheduledMetaByHabit = {};
    for (const key of HABIT_KEYS) {
      const meta = parsed[key];
      if (
        meta &&
        typeof meta === 'object' &&
        typeof (meta as { identifier?: unknown }).identifier === 'string' &&
        typeof (meta as { scheduledAt?: unknown }).scheduledAt === 'string'
      ) {
        result[key] = {
          identifier: (meta as { identifier: string }).identifier,
          scheduledAt: (meta as { scheduledAt: string }).scheduledAt,
        };
      }
    }
    return result;
  } catch {
    return {};
  }
};

const writeScheduledMetaByHabit = async (value: ScheduledMetaByHabit): Promise<void> => {
  await AsyncStorage.setItem(META_STORAGE_KEY, JSON.stringify(value));
};

const hasNotificationPermission = async (): Promise<boolean> => {
  try {
    const permission = await getPermissionsAsync();
    return permission.granted;
  } catch {
    return false;
  }
};

export const getNotificationPermissionState = async (): Promise<NotificationPermissionState> => {
  try {
    const permission = await getPermissionsAsync();
    if (permission.granted) return 'granted';
    if (permission.canAskAgain === false) return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
};

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;
  await setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Recordatorios de habitos',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#22c55e',
  });
};

const applyQuietHoursPolicyInternal = (
  candidate: Date,
  globalConfig: NotificationGlobalSettings
): Date => {
  if (!globalConfig.quietHoursEnabled) return candidate;

  const quietFrom = parseTime(globalConfig.quietFrom);
  const quietTo = parseTime(globalConfig.quietTo);
  if (!quietFrom || !quietTo) return candidate;

  const quietFromMin = toMinutes(quietFrom.hour, quietFrom.minute);
  const quietToMin = toMinutes(quietTo.hour, quietTo.minute);
  const currentMin = toMinutes(candidate.getHours(), candidate.getMinutes());

  if (!isWithinQuietRange(currentMin, quietFromMin, quietToMin)) {
    return candidate;
  }

  const adjusted = new Date(candidate);
  if (quietFromMin < quietToMin) {
    adjusted.setHours(quietTo.hour, quietTo.minute, 0, 0);
    return adjusted;
  }

  if (currentMin >= quietFromMin) {
    adjusted.setDate(adjusted.getDate() + 1);
    adjusted.setHours(quietTo.hour, quietTo.minute, 0, 0);
    return adjusted;
  }

  adjusted.setHours(quietTo.hour, quietTo.minute, 0, 0);
  return adjusted;
};

const buildInitialCandidate = (
  now: Date,
  habitKey: HabitNotificationKey,
  habitConfig: NotificationHabitSettings,
  _globalConfig: NotificationGlobalSettings
): Date => {
  const parsed = parseTime(habitConfig.time);
  const fallback = DEFAULT_HABIT_TIMES[habitKey];
  const target = parsed ?? fallback;

  const candidate = new Date(now);
  candidate.setHours(target.hour, target.minute, 0, 0);

  const completedToday = wasCompletedToday(habitConfig.lastCompletedDate, now);
  if (completedToday || candidate <= now) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
};

const scheduleHabitNotificationInternal = async (
  habitKey: HabitNotificationKey,
  habitConfig: NotificationHabitSettings,
  globalConfig: NotificationGlobalSettings,
  options: { skipCancel?: boolean } = {}
): Promise<string | null> => {
  if (!options.skipCancel) {
    await cancelHabitNotification(habitKey);
  }

  if (!globalConfig.enabled || !habitConfig.enabled) {
    return null;
  }

  await ensureAndroidChannel();

  const now = new Date();
  let candidate = buildInitialCandidate(now, habitKey, habitConfig, globalConfig);
  candidate = applyQuietHoursPolicyInternal(candidate, globalConfig);

  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 1);
    candidate = applyQuietHoursPolicyInternal(candidate, globalConfig);
  }

  const content = HABIT_CONTENT[habitKey];
  const trigger: NotificationTriggerInput =
    Platform.OS === 'android'
      ? {
          // In Expo Go on Android, interval-based scheduling is more reliable
          // than exact date alarms for MVP local reminders.
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.ceil((candidate.getTime() - now.getTime()) / 1000)),
          channelId: ANDROID_CHANNEL_ID,
        }
      : {
          type: SchedulableTriggerInputTypes.DATE,
          date: candidate,
        };
  const identifier = await scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      sound: 'default',
      data: {
        source: MANAGED_SOURCE,
        habitKey,
      },
    },
    trigger,
  });

  const stored = await readScheduledByHabit();
  stored[habitKey] = identifier;
  await writeScheduledByHabit(stored);

  const meta = await readScheduledMetaByHabit();
  meta[habitKey] = {
    identifier,
    scheduledAt: candidate.toISOString(),
  };
  await writeScheduledMetaByHabit(meta);
  return identifier;
};

export const getNextHabitScheduleDate = (
  habitKey: HabitNotificationKey,
  habitConfig: NotificationHabitSettings,
  globalConfig: NotificationGlobalSettings,
  now = new Date()
): Date => {
  const initial = buildInitialCandidate(now, habitKey, habitConfig, globalConfig);
  const adjusted = applyQuietHoursPolicyInternal(initial, globalConfig);
  if (adjusted > now) return adjusted;
  adjusted.setDate(adjusted.getDate() + 1);
  return applyQuietHoursPolicyInternal(adjusted, globalConfig);
};

export const applyQuietHoursPolicy = (
  date: Date,
  globalConfig: NotificationGlobalSettings
): Date => applyQuietHoursPolicyInternal(new Date(date), globalConfig);

export async function getHabitReminderDebugInfo(
  habitKey: HabitNotificationKey,
  snapshot: HabitReminderSnapshot
): Promise<HabitReminderDebugInfo> {
  const now = new Date();
  const permissionState = await getNotificationPermissionState();
  const globalConfig: NotificationGlobalSettings = {
    enabled: snapshot.globalEnabled,
    summaryTime: DEFAULT_NOTIFICATION_SETTINGS.global.summaryTime,
    quietHoursEnabled: snapshot.quietHoursEnabled,
    quietFrom: snapshot.quietFrom,
    quietTo: snapshot.quietTo,
  };
  const habitConfig: NotificationHabitSettings = {
    enabled: snapshot.habitEnabled,
    time: snapshot.time,
    lastCompletedDate: snapshot.lastCompletedDate,
  };

  const initial = buildInitialCandidate(now, habitKey, habitConfig, globalConfig);
  const adjusted = applyQuietHoursPolicyInternal(initial, globalConfig);
  const blockedByQuietHours = adjusted.getTime() !== initial.getTime();
  const blockedByGlobal = !snapshot.globalEnabled;
  const blockedByPermissions = permissionState !== 'granted';
  const completedToday = wasCompletedToday(snapshot.lastCompletedDate, now);

  const scheduledMeta = (await readScheduledMetaByHabit())[habitKey];
  if (scheduledMeta?.scheduledAt) {
    return {
      permissionState,
      nextScheduledAt: scheduledMeta.scheduledAt,
      nextScheduledSource: 'scheduled',
      completedToday,
      blockedByGlobal,
      blockedByQuietHours,
      blockedByPermissions,
    };
  }

  if (blockedByGlobal || !snapshot.habitEnabled || blockedByPermissions) {
    return {
      permissionState,
      nextScheduledAt: null,
      nextScheduledSource: 'none',
      completedToday,
      blockedByGlobal,
      blockedByQuietHours,
      blockedByPermissions,
    };
  }

  const nextCalculatedDate = getNextHabitScheduleDate(habitKey, habitConfig, globalConfig, now);
  return {
    permissionState,
    nextScheduledAt: nextCalculatedDate.toISOString(),
    nextScheduledSource: 'calculated',
    completedToday,
    blockedByGlobal,
    blockedByQuietHours,
    blockedByPermissions,
  };
}

export function configureNotificationRuntime() {
  if (runtimeConfigured) return;
  runtimeConfigured = true;
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  configureNotificationRuntime();
  if (await hasNotificationPermission()) {
    return true;
  }

  const requested = await requestPermissionsAsync();
  return requested.granted;
}

export async function sendHabitTestNotification(habitKey: HabitNotificationKey): Promise<boolean> {
  configureNotificationRuntime();
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return false;
  }

  await ensureAndroidChannel();

  const content = HABIT_CONTENT[habitKey];
  const trigger: NotificationTriggerInput =
    Platform.OS === 'android'
      ? { channelId: ANDROID_CHANNEL_ID }
      : null;

  await scheduleNotificationAsync({
    content: {
      title: `Prueba: ${content.title}`,
      body: 'Si ves este aviso, las notificaciones locales funcionan en este dispositivo.',
      sound: 'default',
      data: {
        source: `${MANAGED_SOURCE}_test`,
        habitKey,
      },
    },
    trigger,
  });

  return true;
}

export async function cancelHabitNotification(habitKey: HabitNotificationKey): Promise<void> {
  const stored = await readScheduledByHabit();
  const knownId = stored[habitKey];
  if (knownId) {
    try {
      await cancelScheduledNotificationAsync(knownId);
    } catch {
      // noop: id may no longer exist
    }
    delete stored[habitKey];
    await writeScheduledByHabit(stored);
  }

  const meta = await readScheduledMetaByHabit();
  if (meta[habitKey]) {
    delete meta[habitKey];
    await writeScheduledMetaByHabit(meta);
  }

  const requests = await getAllScheduledNotificationsAsync();
  const duplicates = requests.filter((request) => getManagedHabitFromRequest(request) === habitKey);
  for (const request of duplicates) {
    await cancelScheduledNotificationAsync(request.identifier);
  }
}

export async function cancelAllHabitNotifications(): Promise<void> {
  const stored = await readScheduledByHabit();
  for (const id of Object.values(stored)) {
    if (!id) continue;
    try {
      await cancelScheduledNotificationAsync(id);
    } catch {
      // noop: id may no longer exist
    }
  }

  const requests = await getAllScheduledNotificationsAsync();
  const managed = requests.filter((request) => getManagedHabitFromRequest(request) !== null);
  for (const request of managed) {
    await cancelScheduledNotificationAsync(request.identifier);
  }

  await writeScheduledByHabit({});
  await writeScheduledMetaByHabit({});
}

export async function scheduleHabitNotification(
  habitKey: HabitNotificationKey,
  habitConfig: NotificationHabitSettings,
  globalConfig: NotificationGlobalSettings
): Promise<string | null> {
  return scheduleHabitNotificationInternal(habitKey, habitConfig, globalConfig);
}

export async function rescheduleHabitNotification(
  habitKey: HabitNotificationKey,
  habitConfig: NotificationHabitSettings,
  globalConfig: NotificationGlobalSettings
): Promise<string | null> {
  await cancelHabitNotification(habitKey);
  return scheduleHabitNotificationInternal(habitKey, habitConfig, globalConfig, { skipCancel: true });
}

export async function syncAllHabitNotifications(
  settings: NotificationSettings,
  options: { requestPermissions?: boolean } = {}
): Promise<void> {
  configureNotificationRuntime();

  if (!settings.global.enabled) {
    await cancelAllHabitNotifications();
    return;
  }

  const enabledHabitKeys = HABIT_KEYS.filter((habitKey) => settings.habits[habitKey].enabled);
  if (enabledHabitKeys.length === 0) {
    await cancelAllHabitNotifications();
    return;
  }

  const shouldRequestPermissions = options.requestPermissions ?? false;
  const canNotify = shouldRequestPermissions
    ? await requestNotificationPermissions()
    : await hasNotificationPermission();

  if (!canNotify) {
    await cancelAllHabitNotifications();
    return;
  }

  await ensureAndroidChannel();
  await cancelAllHabitNotifications();

  for (const habitKey of enabledHabitKeys) {
    const habitConfig = settings.habits[habitKey];
    await scheduleHabitNotificationInternal(habitKey, habitConfig, settings.global, { skipCancel: true });
  }
}

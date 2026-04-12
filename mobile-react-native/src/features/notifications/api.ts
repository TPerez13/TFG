import { apiFetch } from '../../services/api';
import { fetchHabitEntries } from '../habits/entriesApi';
import { syncAllHabitNotifications } from './localNotifications';
import {
  buildHabitReminderRuntimeState,
  needsGoalEvaluation,
  type HabitReminderRuntimeState,
} from './runtimeState';
import type { NotificationSettings, NotificationSettingsPatch } from './types';

export class NotificationSettingsApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'NotificationSettingsApiError';
    this.status = status;
  }
}

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? fallback;
  } catch {
    return fallback;
  }
};

const getDayRange = (baseDate: Date) => {
  const from = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
  const to = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

const buildRuntimeState = async (
  settings: NotificationSettings,
  date = new Date(),
): Promise<HabitReminderRuntimeState> => {
  if (!settings.global.enabled || !needsGoalEvaluation(settings)) {
    return {};
  }

  const range = getDayRange(date);
  const [entries, userRes] = await Promise.all([
    fetchHabitEntries({ from: range.from, to: range.to }),
    apiFetch('/users/me'),
  ]);

  if (!userRes.ok) {
    throw new NotificationSettingsApiError(
      await parseErrorMessage(userRes, 'No se pudo cargar el estado diario de recordatorios.'),
      userRes.status,
    );
  }

  const payload = (await userRes.json()) as {
    user?: {
      preferencias?: Record<string, unknown> | null;
    };
  };

  return buildHabitReminderRuntimeState(entries, payload.user ?? null, date);
};

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const response = await apiFetch('/notifications/settings');
  if (!response.ok) {
    throw new NotificationSettingsApiError(
      await parseErrorMessage(response, 'No se pudo cargar la configuracion de avisos.'),
      response.status,
    );
  }

  const payload = (await response.json()) as { settings?: NotificationSettings };
  if (!payload.settings) {
    throw new NotificationSettingsApiError('Respuesta invalida al cargar configuracion de avisos.');
  }
  return payload.settings;
}

export async function patchNotificationSettings(
  patch: NotificationSettingsPatch,
  options: { syncLocal?: boolean; requestPermissions?: boolean } = {},
): Promise<NotificationSettings> {
  const response = await apiFetch('/notifications/settings', {
    method: 'PATCH',
    body: JSON.stringify({ settings: patch }),
  });
  if (!response.ok) {
    throw new NotificationSettingsApiError(
      await parseErrorMessage(response, 'No se pudo guardar la configuracion de avisos.'),
      response.status,
    );
  }

  const payload = (await response.json()) as { settings?: NotificationSettings };
  if (!payload.settings) {
    throw new NotificationSettingsApiError('Respuesta invalida al guardar configuracion de avisos.');
  }

  if (options.syncLocal !== false) {
    try {
      const runtimeState = await buildRuntimeState(payload.settings);
      await syncAllHabitNotifications(payload.settings, {
        requestPermissions: options.requestPermissions ?? false,
        runtimeState,
      });
    } catch {
      // La configuracion remota ya se guardo; no bloqueamos por error local.
    }
  }

  return payload.settings;
}

export async function syncLocalNotificationsWithServer(
  options: { requestPermissions?: boolean; settingsOverride?: NotificationSettings } = {},
): Promise<NotificationSettings> {
  const settings = options.settingsOverride ?? await fetchNotificationSettings();
  let runtimeState: HabitReminderRuntimeState = {};

  try {
    runtimeState = await buildRuntimeState(settings);
  } catch {
    runtimeState = {};
  }

  try {
    await syncAllHabitNotifications(settings, {
      requestPermissions: options.requestPermissions ?? false,
      runtimeState,
    });
  } catch {
    // noop: el caller decide si quiere actuar ante fallos de sincronizacion local.
  }

  return settings;
}

import { apiFetch } from '../../services/api';
import type { NotificationSettings, NotificationSettingsPatch } from './types';
import { syncAllHabitNotifications } from './localNotifications';

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

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const response = await apiFetch('/notifications/settings');
  if (!response.ok) {
    throw new NotificationSettingsApiError(
      await parseErrorMessage(response, 'No se pudo cargar la configuracion de avisos.'),
      response.status
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
  options: { syncLocal?: boolean; requestPermissions?: boolean } = {}
): Promise<NotificationSettings> {
  const response = await apiFetch('/notifications/settings', {
    method: 'PATCH',
    body: JSON.stringify({ settings: patch }),
  });
  if (!response.ok) {
    throw new NotificationSettingsApiError(
      await parseErrorMessage(response, 'No se pudo guardar la configuracion de avisos.'),
      response.status
    );
  }

  const payload = (await response.json()) as { settings?: NotificationSettings };
  if (!payload.settings) {
    throw new NotificationSettingsApiError('Respuesta invalida al guardar configuracion de avisos.');
  }
  if (options.syncLocal !== false) {
    try {
      await syncAllHabitNotifications(payload.settings, {
        requestPermissions: options.requestPermissions ?? false,
      });
    } catch {
      // La configuracion remota ya se guardo; no bloqueamos por error local.
    }
  }
  return payload.settings;
}

export async function syncLocalNotificationsWithServer(
  options: { requestPermissions?: boolean } = {}
): Promise<NotificationSettings> {
  const settings = await fetchNotificationSettings();
  try {
    await syncAllHabitNotifications(settings, {
      requestPermissions: options.requestPermissions ?? false,
    });
  } catch {
    // noop: el caller decide si quiere actuar ante fallos de sincronizacion local.
  }
  return settings;
}

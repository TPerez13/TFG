import type { HabitNotificationKey, NotificationSettingsPatch } from './types';
import { patchNotificationSettings } from './api';
import { getNotificationPermissionState, type NotificationPermissionState } from './localNotifications';

type SaveHabitReminderOptions = {
  requestPermissions?: boolean;
};

export type SaveHabitReminderResult = {
  permissionState: NotificationPermissionState | null;
  shouldBeScheduled: boolean;
};

export async function saveHabitReminderPatch(
  habitKey: HabitNotificationKey,
  partial: NonNullable<NotificationSettingsPatch['habits']>[HabitNotificationKey],
  options: SaveHabitReminderOptions = {}
): Promise<SaveHabitReminderResult> {
  const patch: NotificationSettingsPatch = {
    habits: {
      [habitKey]: partial,
    } as NotificationSettingsPatch['habits'],
  };

  const nextSettings = await patchNotificationSettings(patch, {
    requestPermissions: options.requestPermissions ?? false,
  });

  const shouldBeScheduled = nextSettings.global.enabled && nextSettings.habits[habitKey].enabled;
  if (!shouldBeScheduled) {
    return {
      permissionState: null,
      shouldBeScheduled,
    };
  }

  return {
    permissionState: await getNotificationPermissionState(),
    shouldBeScheduled,
  };
}

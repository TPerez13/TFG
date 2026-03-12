import type {
  HabitNotificationKey,
  Notification,
  NotificationListResponse,
  NotificationSettingsPatch,
  NotificationType,
  NotificationUnreadCountResponse,
  NotificationSettings,
} from '@muchasvidas/shared';

export type {
  HabitNotificationKey,
  Notification,
  NotificationListResponse,
  NotificationSettingsPatch,
  NotificationType,
  NotificationUnreadCountResponse,
  NotificationSettings,
};

export type NotificationsFilter = {
  type?: NotificationType;
  unreadOnly?: boolean;
};

export type HabitReminderSnapshot = {
  globalEnabled: boolean;
  quietHoursEnabled: boolean;
  quietFrom: string;
  quietTo: string;
  habitEnabled: boolean;
  time: string;
  lastCompletedDate: string | null;
};

export type HabitReminderDebugInfo = {
  permissionState: 'granted' | 'denied' | 'undetermined';
  nextScheduledAt: string | null;
  nextScheduledSource: 'scheduled' | 'calculated' | 'none';
  completedToday: boolean;
  blockedByGlobal: boolean;
  blockedByQuietHours: boolean;
  blockedByPermissions: boolean;
};

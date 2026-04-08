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

export type HabitReminderSnapshot = {
  globalEnabled: boolean;
  quietHoursEnabled: boolean;
  quietFrom: string;
  quietTo: string;
  habitEnabled: boolean;
  time: string;
  lastCompletedDate: string | null;
};

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

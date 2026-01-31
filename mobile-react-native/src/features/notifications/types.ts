import type {
  Notification,
  NotificationListResponse,
  NotificationType,
  NotificationUnreadCountResponse,
  NotificationSettings,
} from '@muchasvidas/shared';

export type {
  Notification,
  NotificationListResponse,
  NotificationType,
  NotificationUnreadCountResponse,
  NotificationSettings,
};

export type NotificationsFilter = {
  type?: NotificationType;
  unreadOnly?: boolean;
};

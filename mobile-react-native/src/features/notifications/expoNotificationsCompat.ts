// Expo Go on Android crashes if we load the package entrypoint because it
// pulls remote-push auto-registration side effects. For the MVP we only need
// local notifications, so we import the concrete modules we actually use.
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import {
  SchedulableTriggerInputTypes,
} from 'expo-notifications/build/Notifications.types';
import type { NotificationRequest, NotificationTriggerInput } from 'expo-notifications/build/Notifications.types';

export {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
  setNotificationChannelAsync,
  setNotificationHandler,
};

export type { NotificationRequest, NotificationTriggerInput };

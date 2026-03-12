import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../../navigation/AuthContext';
import {
  cancelAllHabitNotifications,
  configureNotificationRuntime,
} from './localNotifications';
import { syncLocalNotificationsWithServer } from './api';

async function syncFromServer(requestPermissions: boolean) {
  try {
    await syncLocalNotificationsWithServer({ requestPermissions });
  } catch {
    // El flujo principal de la app no debe bloquearse por un fallo de sincronizacion local.
  }
}

export function NotificationRuntime() {
  const { token, loading } = useAuth();

  useEffect(() => {
    configureNotificationRuntime();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!token) {
      void cancelAllHabitNotifications();
      return;
    }

    void syncFromServer(true);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && token) {
        void syncFromServer(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loading, token]);

  return null;
}

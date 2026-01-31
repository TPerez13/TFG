import { useCallback, useEffect, useState } from 'react';
import type { NotificationUnreadCountResponse } from './types';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../navigation/AuthContext';

export function useUnreadCount() {
  const { signOut } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch('/notifications/unread-count');
      if (res.status === 401) {
        await signOut();
        return;
      }
      if (!res.ok) return;
      const payload = (await res.json()) as NotificationUnreadCountResponse;
      setCount(payload.count ?? 0);
    } catch {
      // ignore transient errors
    }
  }, [signOut]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { count, refresh, setCount };
}

import { useCallback, useEffect, useState } from 'react';
import type { Notification, NotificationListResponse, NotificationsFilter } from './types';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../navigation/AuthContext';

type UseNotificationsOptions = {
  filter: NotificationsFilter;
};

export function useNotificationsQuery({ filter }: UseNotificationsOptions) {
  const { signOut } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const buildQuery = (nextCursor?: string | null) => {
    const params = new URLSearchParams();
    params.set('limit', '20');
    if (filter.type) params.set('type', filter.type);
    if (filter.unreadOnly) params.set('unreadOnly', 'true');
    if (nextCursor) params.set('cursor', nextCursor);
    return params.toString();
  };

  const fetchPage = useCallback(
    async (nextCursor?: string | null, replace = false) => {
      try {
        const res = await apiFetch(`/notifications?${buildQuery(nextCursor ?? undefined)}`);
        if (res.status === 401) {
          await signOut();
          return;
        }
        if (!res.ok) {
          setError('No se pudo cargar las notificaciones.');
          return;
        }
        const payload = (await res.json()) as NotificationListResponse;
        const nextItems = payload.items ?? [];
        setItems((prev) => (replace ? nextItems : [...prev, ...nextItems]));
        setCursor(payload.nextCursor);
        setHasMore(Boolean(payload.nextCursor));
      } catch (err: any) {
        setError(err?.message ?? 'Error al cargar notificaciones.');
      }
    },
    [filter.type, filter.unreadOnly, signOut]
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await fetchPage(null, true);
    setRefreshing(false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchPage(cursor, false);
  }, [cursor, fetchPage, hasMore, loading]);

  useEffect(() => {
    setLoading(true);
    setItems([]);
    setCursor(null);
    setHasMore(true);
    fetchPage(null, true).finally(() => setLoading(false));
  }, [fetchPage, filter.type, filter.unreadOnly]);

  return {
    items,
    setItems,
    loading,
    refreshing,
    error,
    refresh,
    loadMore,
    hasMore,
  };
}

import { useCallback, useEffect, useState } from 'react';
import { fetchRecentFoods } from './api';
import type { FoodTemplate } from './types';

type UseRecentFoodsResult = {
  items: FoodTemplate[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useRecentFoods(limit = 10): UseRecentFoodsResult {
  const [items, setItems] = useState<FoodTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await fetchRecentFoods(limit);
      setItems(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los alimentos recientes.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}

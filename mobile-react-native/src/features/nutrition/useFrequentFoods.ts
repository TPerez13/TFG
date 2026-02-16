import { useCallback, useEffect, useState } from 'react';
import { fetchFrequentFoods } from './api';
import type { FoodTemplate } from './types';

type UseFrequentFoodsResult = {
  items: FoodTemplate[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useFrequentFoods(limit = 10): UseFrequentFoodsResult {
  const [items, setItems] = useState<FoodTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await fetchFrequentFoods(limit);
      setItems(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los alimentos frecuentes.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}

import { useCallback, useEffect, useState } from 'react';
import { loadRecentFoodsItems } from './loaders';
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
    setLoading(true);
    const result = await loadRecentFoodsItems(limit);
    setItems(result.items);
    setError(result.error);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}

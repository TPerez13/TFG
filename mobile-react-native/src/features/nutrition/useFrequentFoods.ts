import { useCallback, useEffect, useState } from 'react';
import { loadFrequentFoodsItems } from './loaders';
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
    setLoading(true);
    const result = await loadFrequentFoodsItems(limit);
    setItems(result.items);
    setError(result.error);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}

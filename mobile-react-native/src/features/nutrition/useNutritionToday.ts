import { useCallback, useEffect, useState } from 'react';
import { loadNutritionTodayData } from './loaders';
import type { MealType, NutritionTodayData } from './types';

type UseNutritionTodayResult = {
  data: NutritionTodayData | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useNutritionToday(date: string, tipoComida?: MealType): UseNutritionTodayResult {
  const [data, setData] = useState<NutritionTodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const result = await loadNutritionTodayData(date, tipoComida);
    setData(result.data);
    setError(result.error);
    setLoading(false);
  }, [date, tipoComida]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

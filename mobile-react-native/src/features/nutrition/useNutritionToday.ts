import { useCallback, useEffect, useState } from 'react';
import { fetchNutritionToday } from './api';
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
    try {
      setLoading(true);
      setError(null);
      const payload = await fetchNutritionToday(date, tipoComida);
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la alimentacion.');
    } finally {
      setLoading(false);
    }
  }, [date, tipoComida]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

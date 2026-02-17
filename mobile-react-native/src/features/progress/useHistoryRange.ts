import { useCallback, useEffect, useState } from 'react';
import type { HabitEntry } from '../../types/models';
import { fetchHabitEntries } from '../habits/entriesApi';

type UseHistoryRangeResult = {
  entries: HabitEntry[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useHistoryRange(
  fromISO: string,
  toISO: string,
  typeId?: number,
): UseHistoryRangeResult {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchHabitEntries({
        from: fromISO,
        to: toISO,
        typeId,
      });
      setEntries(items);
    } catch (loadError) {
      setEntries([]);
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, [fromISO, toISO, typeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    entries,
    loading,
    error,
    reload,
  };
}


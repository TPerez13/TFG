import { useCallback, useEffect, useState } from 'react';
import type { HabitEntry } from '../../types/models';
import { loadHistoryRangeEntries } from './historyRangeLoader';

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
    const result = await loadHistoryRangeEntries({ fromISO, toISO, typeId });
    setEntries(result.entries);
    setError(result.error);
    setLoading(false);
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

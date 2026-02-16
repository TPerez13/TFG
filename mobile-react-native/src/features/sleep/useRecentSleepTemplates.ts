import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HabitEntry } from '../../types/models';
import { fetchHabitEntries } from '../habits/entriesApi';
import { getHabitByKey } from '../habits/habitRegistry';
import type { SleepTemplate } from './types';
import { buildSleepTemplateLabel, toSleepHistoryItem, toTemplateFromHistory } from './utils';

const startOfWindowDaysAgo = (baseDate: Date, days: number) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - days, 0, 0, 0, 0);
const endOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

const suggestedTemplates: SleepTemplate[] = [
  { hours: 6, label: '6-none' },
  { hours: 7, label: '7-none' },
  { hours: 8, label: '8-none' },
  { hours: 9, label: '9-none' },
];

type UseRecentSleepTemplatesResult = {
  suggested: SleepTemplate[];
  recent: SleepTemplate[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useRecentSleepTemplates(): UseRecentSleepTemplatesResult {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sleepTypeId = getHabitByKey('sueno')?.idTipoHabito ?? 4;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = startOfWindowDaysAgo(now, 30).toISOString();
      const to = endOfDay(now).toISOString();
      const payload = await fetchHabitEntries({ from, to, typeId: sleepTypeId });
      setEntries(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar recientes de sueno.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [sleepTypeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const recent = useMemo(() => {
    const unique = new Map<string, SleepTemplate>();
    entries
      .map(toSleepHistoryItem)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      .forEach((item) => {
        if (!item.hours) return;
        const template = toTemplateFromHistory(item);
        const key = buildSleepTemplateLabel(template);
        if (!unique.has(key)) {
          unique.set(key, template);
        }
      });
    return Array.from(unique.values()).slice(0, 8);
  }, [entries]);

  return {
    suggested: suggestedTemplates,
    recent,
    loading,
    error,
    reload,
  };
}

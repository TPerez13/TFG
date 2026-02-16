import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HabitEntry } from '../../types/models';
import { fetchHabitEntries } from '../habits/entriesApi';
import { getHabitByKey } from '../habits/habitRegistry';
import type { MeditationTemplate } from './types';
import { buildMeditationTemplateLabel, toMeditationHistoryItem, toTemplateFromHistory } from './utils';

const startOfWindowDaysAgo = (baseDate: Date, days: number) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - days, 0, 0, 0, 0);
const endOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

const suggestedTemplates: MeditationTemplate[] = [
  { type: 'respiracion', durationMin: 3, label: 'respiracion-3' },
  { type: 'mindfulness', durationMin: 5, label: 'mindfulness-5' },
  { type: 'guiada', durationMin: 10, label: 'guiada-10' },
  { type: 'escaneo', durationMin: 15, label: 'escaneo-15' },
];

type UseRecentMeditationTemplatesResult = {
  suggested: MeditationTemplate[];
  recent: MeditationTemplate[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useRecentMeditationTemplates(): UseRecentMeditationTemplatesResult {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const meditationTypeId = getHabitByKey('meditacion')?.idTipoHabito ?? 5;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = startOfWindowDaysAgo(now, 30).toISOString();
      const to = endOfDay(now).toISOString();
      const payload = await fetchHabitEntries({ from, to, typeId: meditationTypeId });
      setEntries(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar recientes de meditacion.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [meditationTypeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const recent = useMemo(() => {
    const unique = new Map<string, MeditationTemplate>();
    entries
      .map(toMeditationHistoryItem)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      .forEach((item) => {
        if (!item.durationMin) return;
        const template = toTemplateFromHistory(item);
        const key = buildMeditationTemplateLabel(template);
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

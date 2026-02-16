import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HabitEntry } from '../../types/models';
import { getHabitByKey } from '../habits/habitRegistry';
import { fetchHabitEntries } from '../habits/entriesApi';
import type { ExerciseTemplate } from './types';
import {
  buildTemplateLabel,
  toExerciseHistoryItem,
  toTemplateFromHistory,
} from './utils';

const startOfWindowDaysAgo = (baseDate: Date, days: number) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - days, 0, 0, 0, 0);
const endOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

const suggestedTemplates: ExerciseTemplate[] = [
  { activityType: 'caminata', durationMin: 10, label: 'caminata-10' },
  { activityType: 'caminata', durationMin: 20, label: 'caminata-20' },
  { activityType: 'carrera', durationMin: 15, label: 'carrera-15' },
  { activityType: 'fuerza', durationMin: 30, label: 'fuerza-30' },
  { activityType: 'otro', durationMin: 10, label: 'otro-10', notesText: 'Estiramientos' },
];

type UseRecentExerciseTemplatesResult = {
  suggested: ExerciseTemplate[];
  recent: ExerciseTemplate[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useRecentExerciseTemplates(): UseRecentExerciseTemplatesResult {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const exerciseTypeId = getHabitByKey('ejercicio')?.idTipoHabito ?? 3;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = startOfWindowDaysAgo(now, 30).toISOString();
      const to = endOfDay(now).toISOString();
      const payload = await fetchHabitEntries({ from, to, typeId: exerciseTypeId });
      setEntries(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar recientes de ejercicio.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [exerciseTypeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const recent = useMemo(() => {
    const unique = new Map<string, ExerciseTemplate>();
    entries
      .map(toExerciseHistoryItem)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      .forEach((item) => {
        if (!item.durationMin) return;
        const template = toTemplateFromHistory(item);
        const key = buildTemplateLabel(template);
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

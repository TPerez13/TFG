import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HabitEntry, User } from '../../types/models';
import { fetchHabitEntries } from '../habits/entriesApi';
import { apiFetch } from '../../services/api';
import { getHabitByKey } from '../habits/habitRegistry';
import type { ExerciseActivityType, ExerciseHistoryItem } from './types';
import { toExerciseHistoryItem } from './utils';

const DEFAULT_GOAL_MIN = 45;

type ExerciseTodayData = {
  goalMin: number;
  totalMin: number;
  sessionsCount: number;
  progress: number;
  history: ExerciseHistoryItem[];
  remindersEnabled: boolean;
};

type UseExerciseTodayResult = {
  data: ExerciseTodayData;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const startOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
const endOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

const getGoalMinutes = (preferences: unknown) => {
  if (!preferences || typeof preferences !== 'object') return DEFAULT_GOAL_MIN;
  const prefs = preferences as Record<string, unknown>;
  const goals = prefs.goals as Record<string, unknown> | undefined;
  const ejercicio = goals?.ejercicio;
  if (!ejercicio || typeof ejercicio !== 'object') return DEFAULT_GOAL_MIN;
  const goalObj = ejercicio as Record<string, unknown>;
  const value = Number(goalObj.value);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_GOAL_MIN;
  return Math.round(value);
};

const getReminderEnabled = (preferences: unknown) => {
  if (!preferences || typeof preferences !== 'object') return true;
  const prefs = preferences as Record<string, unknown>;
  const notifications = prefs.notificaciones;
  if (!notifications || typeof notifications !== 'object') return true;
  const value = (notifications as Record<string, unknown>).ejercicio;
  return typeof value === 'boolean' ? value : true;
};

const initialData: ExerciseTodayData = {
  goalMin: DEFAULT_GOAL_MIN,
  totalMin: 0,
  sessionsCount: 0,
  progress: 0,
  history: [],
  remindersEnabled: true,
};

export function useExerciseToday(
  date: Date,
  selectedType?: ExerciseActivityType,
): UseExerciseTodayResult {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const exerciseTypeId = getHabitByKey('ejercicio')?.idTipoHabito ?? 3;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = startOfDay(date).toISOString();
      const to = endOfDay(date).toISOString();
      const [entriesRes, userRes] = await Promise.all([
        fetchHabitEntries({ from, to, typeId: exerciseTypeId }),
        apiFetch('/users/me'),
      ]);

      if (!userRes.ok) {
        throw new Error('No se pudo cargar usuario para meta de ejercicio.');
      }

      const userPayload = (await userRes.json()) as { user?: User };
      setEntries(entriesRes);
      setUser(userPayload.user ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar ejercicio.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [date, exerciseTypeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const data = useMemo<ExerciseTodayData>(() => {
    const mappedHistory = entries
      .map(toExerciseHistoryItem)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    const filteredHistory = selectedType
      ? mappedHistory.filter((item) => item.activityType === selectedType)
      : mappedHistory;

    const goalMin = getGoalMinutes(user?.preferencias);
    const totalMin = mappedHistory.reduce((sum, item) => sum + item.durationMin, 0);
    const progress = goalMin > 0 ? Math.max(0, Math.min(totalMin / goalMin, 1)) : 0;

    return {
      goalMin,
      totalMin,
      sessionsCount: mappedHistory.length,
      progress,
      history: filteredHistory,
      remindersEnabled: getReminderEnabled(user?.preferencias),
    };
  }, [entries, selectedType, user?.preferencias]);

  return {
    data,
    loading,
    error,
    reload,
  };
}

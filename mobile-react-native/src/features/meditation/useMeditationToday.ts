import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HabitEntry, User } from '../../types/models';
import { apiFetch } from '../../services/api';
import { fetchHabitEntries } from '../habits/entriesApi';
import { getHabitByKey } from '../habits/habitRegistry';
import type { MeditationHistoryItem, MeditationSessionType } from './types';
import { toMeditationHistoryItem } from './utils';

const DEFAULT_GOAL_MIN = getHabitByKey('meditacion')?.goal.value ?? 10;

type MeditationTodayData = {
  goalMin: number;
  totalMin: number;
  sessionsCount: number;
  progress: number;
  history: MeditationHistoryItem[];
  remindersEnabled: boolean;
};

type UseMeditationTodayResult = {
  data: MeditationTodayData;
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
  const meditation = goals?.meditacion;
  if (!meditation || typeof meditation !== 'object') return DEFAULT_GOAL_MIN;
  const meditationGoalObj = meditation as Record<string, unknown>;
  const value = Number(meditationGoalObj.value);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_GOAL_MIN;
  return Math.round(value);
};

const getReminderEnabled = (preferences: unknown) => {
  if (!preferences || typeof preferences !== 'object') return true;
  const prefs = preferences as Record<string, unknown>;
  const notifications = prefs.notificaciones as Record<string, unknown> | undefined;
  if (!notifications) return true;
  const value = notifications.meditacion;
  return typeof value === 'boolean' ? value : true;
};

const initialData: MeditationTodayData = {
  goalMin: DEFAULT_GOAL_MIN,
  totalMin: 0,
  sessionsCount: 0,
  progress: 0,
  history: [],
  remindersEnabled: true,
};

export function useMeditationToday(
  date: Date,
  selectedType?: MeditationSessionType,
): UseMeditationTodayResult {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const meditationTypeId = getHabitByKey('meditacion')?.idTipoHabito ?? 5;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = startOfDay(date).toISOString();
      const to = endOfDay(date).toISOString();
      const [entriesRes, userRes] = await Promise.all([
        fetchHabitEntries({ from, to, typeId: meditationTypeId }),
        apiFetch('/users/me'),
      ]);

      if (!userRes.ok) {
        throw new Error('No se pudo cargar usuario para meta de meditacion.');
      }

      const userPayload = (await userRes.json()) as { user?: User };
      setEntries(entriesRes);
      setUser(userPayload.user ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar meditacion.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [date, meditationTypeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const data = useMemo<MeditationTodayData>(() => {
    const mappedHistory = entries
      .map(toMeditationHistoryItem)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    const filteredHistory = selectedType
      ? mappedHistory.filter((item) => item.type === selectedType)
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
    data: loading && !entries.length ? initialData : data,
    loading,
    error,
    reload,
  };
}

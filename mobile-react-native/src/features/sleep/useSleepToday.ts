import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HabitEntry, User } from '../../types/models';
import { apiFetch } from '../../services/api';
import { fetchHabitEntries } from '../habits/entriesApi';
import { getHabitByKey } from '../habits/habitRegistry';
import type { SleepHistoryItem, SleepQuality } from './types';
import { toSleepHistoryItem } from './utils';
import { normalizeNotificationSettingsFromPreferences } from '../notifications/settings';

const DEFAULT_GOAL_HOURS = 8;

type SleepTodayData = {
  goalHours: number;
  totalHours: number;
  progress: number;
  history: SleepHistoryItem[];
  remindersEnabled: boolean;
  reminderTime: string;
  averageQuality?: SleepQuality;
};

type UseSleepTodayResult = {
  data: SleepTodayData;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const startOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
const endOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

const getGoalHours = (preferences: unknown) => {
  if (!preferences || typeof preferences !== 'object') return DEFAULT_GOAL_HOURS;
  const prefs = preferences as Record<string, unknown>;
  const goals = prefs.goals as Record<string, unknown> | undefined;
  const sueno = goals?.sueno;
  if (!sueno || typeof sueno !== 'object') return DEFAULT_GOAL_HOURS;
  const goalObj = sueno as Record<string, unknown>;
  const value = Number(goalObj.value);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_GOAL_HOURS;
  return value;
};

const getReminderConfig = (preferences: unknown) => {
  const settings = normalizeNotificationSettingsFromPreferences(preferences);
  const habit = settings.habits.sueno;
  return {
    enabled: settings.global.enabled && habit.enabled,
    time: habit.time,
  };
};

const qualityToScore = (quality?: SleepQuality) => {
  if (quality === 'mala') return 1;
  if (quality === 'regular') return 2;
  if (quality === 'buena') return 3;
  return undefined;
};

const scoreToQuality = (score: number): SleepQuality => {
  if (score <= 1.5) return 'mala';
  if (score <= 2.4) return 'regular';
  return 'buena';
};

const initialData: SleepTodayData = {
  goalHours: DEFAULT_GOAL_HOURS,
  totalHours: 0,
  progress: 0,
  history: [],
  remindersEnabled: true,
  reminderTime: '22:00',
};

export function useSleepToday(date: Date): UseSleepTodayResult {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sleepTypeId = getHabitByKey('sueno')?.idTipoHabito ?? 4;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = startOfDay(date).toISOString();
      const to = endOfDay(date).toISOString();
      const [entriesRes, userRes] = await Promise.all([
        fetchHabitEntries({ from, to, typeId: sleepTypeId }),
        apiFetch('/users/me'),
      ]);

      if (!userRes.ok) {
        throw new Error('No se pudo cargar usuario para meta de sueno.');
      }

      const userPayload = (await userRes.json()) as { user?: User };
      setEntries(entriesRes);
      setUser(userPayload.user ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar sueno.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [date, sleepTypeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const data = useMemo<SleepTodayData>(() => {
    const history = entries
      .map(toSleepHistoryItem)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    const goalHours = getGoalHours(user?.preferencias);
    const totalHours = history.reduce((sum, item) => sum + item.hours, 0);
    const progress = goalHours > 0 ? Math.max(0, Math.min(totalHours / goalHours, 1)) : 0;

    const qualityScores = history
      .map((item) => qualityToScore(item.quality))
      .filter((item): item is number => typeof item === 'number');
    const averageQuality =
      qualityScores.length > 0
        ? scoreToQuality(qualityScores.reduce((sum, item) => sum + item, 0) / qualityScores.length)
        : undefined;

    const reminder = getReminderConfig(user?.preferencias);

    return {
      goalHours,
      totalHours,
      progress,
      history,
      remindersEnabled: reminder.enabled,
      reminderTime: reminder.time,
      averageQuality,
    };
  }, [entries, user?.preferencias]);

  return {
    data: loading && !entries.length ? initialData : data,
    loading,
    error,
    reload,
  };
}

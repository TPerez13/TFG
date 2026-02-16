import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HabitEntry, User } from '../../types/models';
import { fetchHabitEntries } from '../habits/entriesApi';
import { apiFetch } from '../../services/api';
import { getHabitByKey } from '../habits/habitRegistry';

const ML_PER_GLASS = 250;
const DEFAULT_GOAL_VALUE = 8;
const DEFAULT_GOAL_UNIT = 'vasos';

type HydrationGoal = {
  value: number;
  unit: 'ml' | 'vasos' | 'l';
};

type HydrationHistoryItem = {
  id: number;
  dateTime: string;
  amountMl: number;
  label: string;
};

type HydrationTodayData = {
  goal: HydrationGoal;
  totalMl: number;
  totalVasos: number;
  remainingMl: number;
  progress: number;
  history: HydrationHistoryItem[];
  recentAmountsMl: number[];
  remindersEnabled: boolean;
};

type UseHydrationTodayResult = {
  data: HydrationTodayData;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const startOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
const endOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

const startOfWindowDaysAgo = (baseDate: Date, days: number) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - days, 0, 0, 0, 0);

const normalizeGoal = (preferences: unknown): HydrationGoal => {
  if (preferences && typeof preferences === 'object') {
    const prefs = preferences as Record<string, unknown>;
    const goals = prefs.goals as Record<string, unknown> | undefined;
    const agua = goals?.agua;
    if (agua && typeof agua === 'object') {
      const goal = agua as Record<string, unknown>;
      const rawValue = Number(goal.value);
      const rawUnit = typeof goal.unit === 'string' ? goal.unit.toLowerCase() : DEFAULT_GOAL_UNIT;
      if (Number.isFinite(rawValue) && rawValue > 0) {
        if (rawUnit === 'ml') return { value: rawValue, unit: 'ml' };
        if (rawUnit === 'l' || rawUnit === 'litros') return { value: rawValue, unit: 'l' };
        return { value: rawValue, unit: 'vasos' };
      }
    }
  }
  return { value: DEFAULT_GOAL_VALUE, unit: 'vasos' };
};

const toMlFromGoal = (goal: HydrationGoal) => {
  if (goal.unit === 'ml') return goal.value;
  if (goal.unit === 'l') return goal.value * 1000;
  return goal.value * ML_PER_GLASS;
};

const toMlFromEntry = (entry: HabitEntry) => {
  const unit = (entry.unidad ?? '').toLowerCase();
  const value = Number(entry.valor) || 0;
  if (!value) return 0;
  if (unit === 'ml') return value;
  if (unit === 'l' || unit === 'litros') return value * 1000;
  if (unit === 'vaso' || unit === 'vasos') return value * ML_PER_GLASS;
  if (value > 30) return value;
  return value * ML_PER_GLASS;
};

const formatEntryLabel = (entry: HabitEntry) => {
  const value = Number(entry.valor) || 0;
  const unit = entry.unidad ?? 'ml';
  if (unit.toLowerCase() === 'ml') return `${Math.round(value)} ml`;
  if (unit.toLowerCase() === 'l' || unit.toLowerCase() === 'litros') return `${value} l`;
  return `${value} ${unit}`;
};

const initialData: HydrationTodayData = {
  goal: { value: DEFAULT_GOAL_VALUE, unit: 'vasos' },
  totalMl: 0,
  totalVasos: 0,
  remainingMl: DEFAULT_GOAL_VALUE * ML_PER_GLASS,
  progress: 0,
  history: [],
  recentAmountsMl: [],
  remindersEnabled: true,
};

export function useHydrationToday(date: Date): UseHydrationTodayResult {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [windowEntries, setWindowEntries] = useState<HabitEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hydrationTypeId = getHabitByKey('agua')?.idTipoHabito ?? 1;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = startOfDay(date).toISOString();
      const to = endOfDay(date).toISOString();
      const windowFrom = startOfWindowDaysAgo(date, 30).toISOString();

      const [todayEntries, thirtyDaysEntries, userRes] = await Promise.all([
        fetchHabitEntries({ from, to, typeId: hydrationTypeId }),
        fetchHabitEntries({ from: windowFrom, to, typeId: hydrationTypeId }),
        apiFetch('/users/me'),
      ]);

      if (!userRes.ok) {
        throw new Error('No se pudo cargar usuario para meta de hidratacion.');
      }

      const userPayload = (await userRes.json()) as { user?: User };
      setEntries(todayEntries);
      setWindowEntries(thirtyDaysEntries);
      setUser(userPayload.user ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar hidratacion.');
      setEntries([]);
      setWindowEntries([]);
    } finally {
      setLoading(false);
    }
  }, [date, hydrationTypeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const data = useMemo<HydrationTodayData>(() => {
    const goal = normalizeGoal(user?.preferencias ?? null);
    const goalMl = toMlFromGoal(goal);
    const totalMl = entries.reduce((sum, entry) => sum + toMlFromEntry(entry), 0);
    const totalVasos = totalMl / ML_PER_GLASS;
    const progress = goalMl > 0 ? Math.max(0, Math.min(totalMl / goalMl, 1)) : 0;
    const remainingMl = Math.max(goalMl - totalMl, 0);
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.f_registro).getTime() - new Date(a.f_registro).getTime(),
    );
    const history = sortedEntries.map((entry) => ({
      id: entry.id_registro_habito,
      dateTime: entry.f_registro,
      amountMl: toMlFromEntry(entry),
      label: formatEntryLabel(entry),
    }));

    const recentAmountsMl = [...windowEntries]
      .sort((a, b) => new Date(b.f_registro).getTime() - new Date(a.f_registro).getTime())
      .map((entry) => Math.round(toMlFromEntry(entry)))
      .filter((value) => value > 0)
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 6);

    const preferences =
      user?.preferencias && typeof user.preferencias === 'object'
        ? (user.preferencias as Record<string, unknown>)
        : null;
    const notifications =
      preferences?.notificaciones && typeof preferences.notificaciones === 'object'
        ? (preferences.notificaciones as Record<string, unknown>)
        : null;
    const remindersEnabled =
      typeof notifications?.hidratacion === 'boolean' ? Boolean(notifications.hidratacion) : true;

    return {
      goal,
      totalMl,
      totalVasos,
      remainingMl,
      progress,
      history,
      recentAmountsMl,
      remindersEnabled,
    };
  }, [entries, user, windowEntries]);

  return {
    data: data ?? initialData,
    loading,
    error,
    reload,
  };
}

export const hydrationUnits = {
  ML_PER_GLASS,
};

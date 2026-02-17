import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HabitEntry, User } from '../../types/models';
import { apiFetch } from '../../services/api';
import { fetchHabitEntries } from '../habits/entriesApi';
import { getHabitByKey, habitRegistry, type HabitKey } from '../habits/habitRegistry';
import {
  computeDailyPct,
  dateToLocalKey,
  formatClock,
  formatEntryValue,
  lastNDays,
  resolveHabitGoals,
  weekdayShortLabel,
} from './historyUtils';

type TrendPoint = {
  dateKey: string;
  label: string;
  total: number;
  pct: number;
};

type RecentTrendItem = {
  id: number;
  valueLabel: string;
  timeLabel: string;
  isoDate: string;
  entry: HabitEntry;
};

export type HabitTrendData = {
  habitKey: HabitKey;
  habitTitle: string;
  icon: string;
  accentColor: string;
  softColor: string;
  goalValue: number;
  goalUnit: string;
  daily: TrendPoint[];
  avgPct: number;
  recentToday: RecentTrendItem[];
  recentYesterday: RecentTrendItem[];
  isEmpty: boolean;
};

type UseHabitTrendResult = {
  data: HabitTrendData;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const startOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
const endOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

const fallbackData = (habitKey: HabitKey): HabitTrendData => {
  const definition = getHabitByKey(habitKey);
  const days = lastNDays(7);
  return {
    habitKey,
    habitTitle: definition?.title ?? habitKey,
    icon: definition?.icon ?? 'ellipse-outline',
    accentColor: definition?.accentColor ?? '#22c55e',
    softColor: definition?.softColor ?? '#eafbf1',
    goalValue: definition?.goal.value ?? 1,
    goalUnit: definition?.goal.unit ?? '',
    daily: days.map((day) => ({
      dateKey: dateToLocalKey(day),
      label: weekdayShortLabel(day),
      total: 0,
      pct: 0,
    })),
    avgPct: 0,
    recentToday: [],
    recentYesterday: [],
    isEmpty: true,
  };
};

const resolveHabitKey = (habitKeyOrTypeId: HabitKey | number): HabitKey | null => {
  if (typeof habitKeyOrTypeId === 'string') return habitKeyOrTypeId;
  const found = habitRegistry.find((item) => item.idTipoHabito === habitKeyOrTypeId);
  return found?.key ?? null;
};

export function useHabitTrend(habitKeyOrTypeId: HabitKey | number, days = 7): UseHabitTrendResult {
  const habitKey = resolveHabitKey(habitKeyOrTypeId) ?? 'agua';
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const definition = getHabitByKey(habitKey);
  const typeId = definition?.idTipoHabito;

  const reload = useCallback(async () => {
    if (!typeId) {
      setEntries([]);
      setLoading(false);
      setError('No se pudo identificar el habito.');
      return;
    }

    setLoading(true);
    setError(null);

    const today = new Date();
    const rangeStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (Math.max(1, days) - 1),
      0,
      0,
      0,
      0,
    );
    const from = startOfDay(rangeStart).toISOString();
    const to = endOfDay(today).toISOString();

    try {
      const [historyEntries, userRes] = await Promise.all([
        fetchHabitEntries({ from, to, typeId }),
        apiFetch('/users/me'),
      ]);

      setEntries(historyEntries);

      if (userRes.ok) {
        const payload = (await userRes.json()) as { user?: User };
        setUser(payload.user ?? null);
      } else {
        setUser(null);
      }
    } catch (loadError) {
      setEntries([]);
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el historial del habito.');
    } finally {
      setLoading(false);
    }
  }, [days, typeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const data = useMemo<HabitTrendData>(() => {
    const fallback = fallbackData(habitKey);
    const goals = resolveHabitGoals(user?.preferencias ?? null);
    const goal = goals.find((item) => item.habitKey === habitKey);
    const reference = goal ?? {
      habitKey,
      typeId: typeId ?? -1,
      title: fallback.habitTitle,
      icon: fallback.icon,
      accentColor: fallback.accentColor,
      softColor: fallback.softColor,
      goalValue: fallback.goalValue,
      goalUnit: fallback.goalUnit,
    };

    const dayList = lastNDays(Math.max(1, days));
    const totalByDay = new Map<string, number>();

    const sortedEntries = [...entries].sort(
      (left, right) => new Date(right.f_registro).getTime() - new Date(left.f_registro).getTime(),
    );

    sortedEntries.forEach((entry) => {
      const parsed = new Date(entry.f_registro);
      if (Number.isNaN(parsed.getTime())) return;
      const key = dateToLocalKey(parsed);
      const current = totalByDay.get(key) ?? 0;
      totalByDay.set(key, current + (Number(entry.valor) || 0));
    });

    const daily = dayList.map((day) => {
      const key = dateToLocalKey(day);
      const total = totalByDay.get(key) ?? 0;
      const pct = computeDailyPct(total, reference.goalValue);
      return {
        dateKey: key,
        label: weekdayShortLabel(day),
        total,
        pct,
      };
    });

    const avgPct =
      daily.length > 0
        ? Math.round(daily.reduce((sum, item) => sum + item.pct, 0) / daily.length)
        : 0;

    const today = new Date();
    const todayKey = dateToLocalKey(today);
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12, 0, 0, 0);
    const yesterdayKey = dateToLocalKey(yesterday);

    const toRecentItem = (entry: HabitEntry): RecentTrendItem => ({
      id: entry.id_registro_habito,
      valueLabel: formatEntryValue(habitKey, entry),
      timeLabel: formatClock(entry.f_registro),
      isoDate: entry.f_registro,
      entry,
    });

    const recentToday = sortedEntries
      .filter((entry) => dateToLocalKey(new Date(entry.f_registro)) === todayKey)
      .map(toRecentItem);
    const recentYesterday = sortedEntries
      .filter((entry) => dateToLocalKey(new Date(entry.f_registro)) === yesterdayKey)
      .map(toRecentItem);

    return {
      habitKey,
      habitTitle: reference.title,
      icon: reference.icon,
      accentColor: reference.accentColor,
      softColor: reference.softColor,
      goalValue: reference.goalValue,
      goalUnit: reference.goalUnit,
      daily,
      avgPct,
      recentToday,
      recentYesterday,
      isEmpty: entries.length === 0,
    };
  }, [days, entries, habitKey, typeId, user?.preferencias]);

  return {
    data,
    loading,
    error,
    reload,
  };
}

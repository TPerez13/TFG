import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HabitEntry, User } from '../../types/models';
import { fetchHabitEntries } from '../habits/entriesApi';
import { getHabitByKey } from '../habits/habitRegistry';
import { apiFetch } from '../../services/api';

type CoreHabitGoal = {
  key: 'agua' | 'comidas' | 'ejercicio' | 'sueno' | 'meditacion';
  typeId: number;
  target: number;
};

export type MonthlyProgressData = {
  monthLabel: string;
  streakDays: number;
  habitsCompleted: number;
  monthlyAvg: number;
  weekly: number[];
  bestWeekIndex: number;
  bestWeekPct: number;
  achievementTitle: string;
  statusLabel: 'CUMPLIDO' | 'EN PROCESO' | 'SIN DATOS';
  isEmpty: boolean;
};

type UseMonthlyProgressResult = {
  data: MonthlyProgressData;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const CORE_HABIT_KEYS = ['agua', 'comidas', 'ejercicio', 'sueno', 'meditacion'] as const;

const startOfMonth = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0, 0);
const endOfMonth = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);
const endOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? fallback;
  } catch {
    return fallback;
  }
};

const dayKeyFromDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toCapitalize = (value: string) => (value ? `${value[0].toUpperCase()}${value.slice(1)}` : value);

export const formatMonthLabel = (month: Date) =>
  toCapitalize(
    new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    }).format(month),
  );

const resolveCoreHabitGoals = (preferences: unknown): CoreHabitGoal[] => {
  const goals =
    preferences && typeof preferences === 'object'
      ? ((preferences as Record<string, unknown>).goals as Record<string, unknown> | undefined)
      : undefined;

  return CORE_HABIT_KEYS.map((key) => {
    const fallbackDefinition = getHabitByKey(key);
    const fallbackTarget = fallbackDefinition?.goal.value ?? 1;
    const nestedGoal = goals?.[key];
    const target =
      nestedGoal && typeof nestedGoal === 'object'
        ? Number((nestedGoal as Record<string, unknown>).value)
        : NaN;

    return {
      key,
      typeId: fallbackDefinition?.idTipoHabito ?? 0,
      target: Number.isFinite(target) && target > 0 ? target : fallbackTarget,
    };
  });
};

const createDefaultData = (selectedMonth: Date): MonthlyProgressData => ({
  monthLabel: formatMonthLabel(selectedMonth),
  streakDays: 0,
  habitsCompleted: 0,
  monthlyAvg: 0,
  weekly: [0, 0, 0, 0, 0],
  bestWeekIndex: 0,
  bestWeekPct: 0,
  achievementTitle: 'Medalla de Constancia',
  statusLabel: 'SIN DATOS',
  isEmpty: true,
});

export function useMonthlyProgress(selectedMonth: Date): UseMonthlyProgressResult {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    const from = startOfMonth(selectedMonth);
    const currentMonthEnd = endOfMonth(selectedMonth);
    const todayEnd = endOfDay(new Date());
    const to = currentMonthEnd.getTime() > todayEnd.getTime() ? todayEnd : currentMonthEnd;

    if (to.getTime() < from.getTime()) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      const [monthlyEntries, userRes] = await Promise.all([
        fetchHabitEntries({
          from: from.toISOString(),
          to: to.toISOString(),
        }),
        apiFetch('/users/me'),
      ]);

      if (!userRes.ok) {
        throw new Error(await parseErrorMessage(userRes, 'No se pudo cargar el usuario.'));
      }

      const userPayload = (await userRes.json()) as { user?: User };
      setEntries(monthlyEntries);
      setUser(userPayload.user ?? null);
    } catch (loadError) {
      setEntries([]);
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el progreso mensual.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const data = useMemo<MonthlyProgressData>(() => {
    const defaults = createDefaultData(selectedMonth);
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const today = new Date();
    const selectedIsCurrentMonth =
      selectedMonth.getFullYear() === today.getFullYear() &&
      selectedMonth.getMonth() === today.getMonth();
    const lastDayForCalc = selectedIsCurrentMonth ? today.getDate() : monthEnd.getDate();

    if (lastDayForCalc <= 0) {
      return defaults;
    }

    const goals = resolveCoreHabitGoals(user?.preferencias ?? null).filter((goal) => goal.typeId > 0);
    if (!goals.length) {
      return defaults;
    }

    const totalsByDay = new Map<string, Map<number, number>>();
    entries.forEach((entry) => {
      const parsedDate = new Date(entry.f_registro);
      if (Number.isNaN(parsedDate.getTime())) {
        return;
      }
      if (
        parsedDate.getMonth() !== monthStart.getMonth() ||
        parsedDate.getFullYear() !== monthStart.getFullYear()
      ) {
        return;
      }
      const key = dayKeyFromDate(parsedDate);
      const dayTotals = totalsByDay.get(key) ?? new Map<number, number>();
      const current = dayTotals.get(entry.id_tipo_habito) ?? 0;
      dayTotals.set(entry.id_tipo_habito, current + (Number(entry.valor) || 0));
      totalsByDay.set(key, dayTotals);
    });

    const dailyCompletionPct: number[] = [];
    let completedTotal = 0;
    let streakCurrent = 0;
    let streakMax = 0;

    for (let day = 1; day <= lastDayForCalc; day += 1) {
      const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day, 12, 0, 0, 0);
      const key = dayKeyFromDate(date);
      const dayTotals = totalsByDay.get(key);

      let metHabits = 0;
      goals.forEach((goal) => {
        const current = dayTotals?.get(goal.typeId) ?? 0;
        if (current >= goal.target) {
          metHabits += 1;
        }
      });

      completedTotal += metHabits;
      const pct = (metHabits / goals.length) * 100;
      dailyCompletionPct.push(pct);

      if (pct >= 80) {
        streakCurrent += 1;
        if (streakCurrent > streakMax) {
          streakMax = streakCurrent;
        }
      } else {
        streakCurrent = 0;
      }
    }

    const plannedChecks = goals.length * lastDayForCalc;
    const completionRate = plannedChecks > 0 ? completedTotal / plannedChecks : 0;
    const monthlyAvg = Math.round(completionRate * 100);

    const weekSpans = [
      [1, 7],
      [8, 14],
      [15, 21],
      [22, 28],
      [29, monthEnd.getDate()],
    ] as const;

    const weekly = weekSpans.map(([startDay, endDay]) => {
      if (startDay > lastDayForCalc) {
        return 0;
      }
      const effectiveEnd = Math.min(endDay, lastDayForCalc);
      const values: number[] = [];
      for (let day = startDay; day <= effectiveEnd; day += 1) {
        values.push(dailyCompletionPct[day - 1] ?? 0);
      }
      if (!values.length) {
        return 0;
      }
      const avg = values.reduce((sum, current) => sum + current, 0) / values.length;
      return Math.round(avg);
    });

    const bestWeekIndex = weekly.reduce(
      (bestIdx, value, index, array) => (value > array[bestIdx] ? index : bestIdx),
      0,
    );
    const bestWeekPct = weekly[bestWeekIndex] ?? 0;

    const isEmpty = entries.length === 0 || plannedChecks === 0;

    return {
      monthLabel: formatMonthLabel(selectedMonth),
      streakDays: streakMax,
      habitsCompleted: completedTotal,
      monthlyAvg,
      weekly,
      bestWeekIndex,
      bestWeekPct,
      achievementTitle: 'Medalla de Constancia',
      statusLabel: isEmpty ? 'SIN DATOS' : completionRate === 1 ? 'CUMPLIDO' : 'EN PROCESO',
      isEmpty,
    };
  }, [entries, selectedMonth, user?.preferencias]);

  return {
    data,
    loading,
    error,
    reload,
  };
}

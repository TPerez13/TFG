import type { HabitEntry } from '../../types/models';
import {
  getHabitByKey,
  type HabitDefinition,
  type HabitKey,
} from '../habits/habitRegistry';

const CORE_HABITS: HabitKey[] = ['agua', 'comidas', 'ejercicio', 'sueno', 'meditacion'];

const DEFAULT_GOALS: Record<HabitKey, { value: number; unit: string }> = {
  agua: { value: 2000, unit: 'ml' },
  comidas: { value: 4, unit: 'platos' },
  ejercicio: { value: 45, unit: 'min' },
  sueno: { value: 8, unit: 'h' },
  meditacion: { value: 10, unit: 'min' },
};

const WEEKDAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;

export type HabitGoalConfig = {
  habitKey: HabitKey;
  typeId: number;
  title: string;
  icon: string;
  accentColor: string;
  softColor: string;
  goalValue: number;
  goalUnit: string;
};

export type AggregatedHabitDay = HabitGoalConfig & {
  total: number;
  latestAt: string | null;
  achieved: boolean;
  pct: number;
  displayValue: string;
  entries: HabitEntry[];
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const dateToLocalKey = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDayKey = (dayKey: string) => {
  const [year, month, day] = dayKey.split('-').map((part) => Number(part));
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0);
};

export const formatDaySectionLabel = (date: Date) => {
  const today = new Date();
  const todayKey = dateToLocalKey(today);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12, 0, 0, 0);
  const yesterdayKey = dateToLocalKey(yesterday);
  const key = dateToLocalKey(date);

  if (key === todayKey) return 'Hoy';
  if (key === yesterdayKey) return 'Ayer';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

export const formatLongDate = (date: Date) =>
  new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

export const formatClock = (isoDate: string | null | undefined) => {
  if (!isoDate) return '--:--';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '--:--';
  return parsed.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const weekdayShortLabel = (date: Date) => WEEKDAY_LABELS[date.getDay()] ?? '?';

export const getDayRange = (date: Date) => {
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const to = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return {
    fromISO: from.toISOString(),
    toISO: to.toISOString(),
  };
};

export const computeDailyPct = (total: number, goal: number) => {
  if (!Number.isFinite(goal) || goal <= 0) return 0;
  return clamp((total / goal) * 100, 0, 100);
};

const toSleepLabelFromHours = (hours: number) => {
  const safeHours = Number.isFinite(hours) ? Math.max(0, hours) : 0;
  const whole = Math.floor(safeHours);
  const minutes = Math.round((safeHours - whole) * 60);
  return `${whole}h ${minutes}min`;
};

const toSleepLabelFromMinutes = (minutesValue: number) => {
  const totalMin = Math.max(0, Math.round(minutesValue));
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return `${hours}h ${minutes}min`;
};

export const formatHabitValue = (habitKey: HabitKey, total: number, unit?: string | null) => {
  const normalizedUnit = `${unit ?? ''}`.toLowerCase();
  const safeTotal = Number.isFinite(total) ? total : 0;

  if (habitKey === 'agua') {
    if (normalizedUnit.includes('vaso')) return `${Math.round(safeTotal)} vasos`;
    if (normalizedUnit === 'l' || normalizedUnit.includes('litro')) return `${safeTotal.toFixed(1)} l`;
    return `${Math.round(safeTotal)} ml`;
  }

  if (habitKey === 'ejercicio' || habitKey === 'meditacion') {
    return `${Math.round(safeTotal)} min`;
  }

  if (habitKey === 'sueno') {
    if (normalizedUnit.includes('min')) return toSleepLabelFromMinutes(safeTotal);
    return toSleepLabelFromHours(safeTotal);
  }

  if (habitKey === 'comidas') {
    return `${Math.round(safeTotal)} platos`;
  }

  return `${Math.round(safeTotal)}`;
};

export const formatEntryValue = (habitKey: HabitKey, entry: HabitEntry) =>
  formatHabitValue(habitKey, Number(entry.valor) || 0, entry.unidad);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const resolveGoalValue = (
  preferenceGoal: Record<string, unknown> | null,
  fallback: { value: number; unit: string },
) => {
  const rawValue = Number(preferenceGoal?.value);
  const value = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : fallback.value;
  const unit = typeof preferenceGoal?.unit === 'string' ? preferenceGoal.unit : fallback.unit;
  return { value, unit };
};

const resolveTitle = (definition: HabitDefinition | undefined, habitKey: HabitKey) => {
  if (definition?.title) return definition.title;
  if (habitKey === 'comidas') return 'Comidas';
  if (habitKey === 'sueno') return 'Sueno';
  return habitKey.charAt(0).toUpperCase() + habitKey.slice(1);
};

export const resolveHabitGoals = (preferences: unknown): HabitGoalConfig[] => {
  const preferencesRecord = asRecord(preferences);
  const goalsRecord = asRecord(preferencesRecord?.goals);

  return CORE_HABITS.map((habitKey) => {
    const definition = getHabitByKey(habitKey);
    const fallback = DEFAULT_GOALS[habitKey];
    const prefGoal = asRecord(goalsRecord?.[habitKey]);
    const resolvedGoal = resolveGoalValue(prefGoal, fallback);

    return {
      habitKey,
      typeId: definition?.idTipoHabito ?? -1,
      title: resolveTitle(definition, habitKey),
      icon: definition?.icon ?? 'ellipse-outline',
      accentColor: definition?.accentColor ?? '#22c55e',
      softColor: definition?.softColor ?? '#eafbf1',
      goalValue: resolvedGoal.value,
      goalUnit: resolvedGoal.unit,
    };
  }).filter((item) => item.typeId > 0);
};

export const groupEntriesByDay = (entries: HabitEntry[]) => {
  const grouped = new Map<string, HabitEntry[]>();
  entries.forEach((entry) => {
    const parsedDate = new Date(entry.f_registro);
    if (Number.isNaN(parsedDate.getTime())) return;
    const key = dateToLocalKey(parsedDate);
    const current = grouped.get(key) ?? [];
    current.push(entry);
    grouped.set(key, current);
  });
  return grouped;
};

export const aggregateByHabitAndDay = (
  entries: HabitEntry[],
  goals: HabitGoalConfig[],
) => {
  const grouped = groupEntriesByDay(entries);
  const typeToHabit = new Map<number, HabitGoalConfig>();
  goals.forEach((goal) => {
    typeToHabit.set(goal.typeId, goal);
  });

  const result = new Map<string, AggregatedHabitDay[]>();

  grouped.forEach((dayEntries, dayKey) => {
    const byHabit = new Map<HabitKey, AggregatedHabitDay>();

    goals.forEach((goal) => {
      byHabit.set(goal.habitKey, {
        ...goal,
        total: 0,
        latestAt: null,
        achieved: false,
        pct: 0,
        displayValue: formatHabitValue(goal.habitKey, 0, goal.goalUnit),
        entries: [],
      });
    });

    dayEntries.forEach((entry) => {
      const habit = typeToHabit.get(entry.id_tipo_habito);
      if (!habit) return;

      const current = byHabit.get(habit.habitKey);
      if (!current) return;

      const nextTotal = current.total + (Number(entry.valor) || 0);
      const existingTime = current.latestAt ? new Date(current.latestAt).getTime() : 0;
      const currentTime = new Date(entry.f_registro).getTime();
      const latestAt = currentTime > existingTime ? entry.f_registro : current.latestAt;

      byHabit.set(habit.habitKey, {
        ...current,
        total: nextTotal,
        latestAt,
        entries: [...current.entries, entry],
      });
    });

    const values = [...byHabit.values()].map((item) => {
      const pct = computeDailyPct(item.total, item.goalValue);
      return {
        ...item,
        pct,
        achieved: pct >= 100,
        displayValue: formatHabitValue(item.habitKey, item.total, item.goalUnit),
      };
    });

    result.set(dayKey, values);
  });

  return result;
};

export const getMotivationalText = (habitKey: HabitKey, achieved: boolean) => {
  if (achieved) return '\u00a1Objetivo alcanzado!';
  if (habitKey === 'agua') return 'Sigue hidratandote.';
  if (habitKey === 'ejercicio') return 'Activa tu cuerpo hoy.';
  if (habitKey === 'sueno') return 'Dormir bien tambien suma.';
  if (habitKey === 'meditacion') return 'Unos minutos de calma ayudan.';
  return 'Suma una comida balanceada.';
};

export const lastNDays = (days: number, fromDate = new Date()) => {
  const items: Date[] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    items.push(new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() - index, 12, 0, 0, 0));
  }
  return items;
};


import type { HabitKey } from './habitRegistry';
import { resolveHabitGoals } from '../progress/historyUtils';

export const GOAL_EDITOR_ORDER: HabitKey[] = ['agua', 'comidas', 'ejercicio', 'sueno', 'meditacion'];

export const GOAL_UNITS: Record<HabitKey, string> = {
  agua: 'ml',
  comidas: 'platos',
  ejercicio: 'min',
  sueno: 'h',
  meditacion: 'min',
};

export type HabitGoalInputMap = Record<HabitKey, string>;
export type HabitGoalValidationErrors = Partial<Record<HabitKey, string>>;

type HabitGoalsPatch = {
  goals: Record<HabitKey, { value: number; unit: string }>;
};

type BuildGoalPatchResult =
  | {
      ok: true;
      patch: HabitGoalsPatch;
      errors: HabitGoalValidationErrors;
    }
  | {
      ok: false;
      patch: null;
      errors: HabitGoalValidationErrors;
    };

const INVALID_GOAL_MESSAGE = 'Introduce un valor mayor que 0.';

const formatGoalValue = (value: number) => {
  const normalized = Math.round(value * 100) / 100;
  return Number.isInteger(normalized) ? `${normalized}` : `${normalized}`;
};

const normalizeGoalValue = (habitKey: HabitKey, value: number) =>
  habitKey === 'sueno' ? Math.round(value * 100) / 100 : Math.round(value);

export const parseGoalInputValue = (rawValue: string): number | null => {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

export const buildGoalInputMap = (preferences: unknown): HabitGoalInputMap => {
  const resolved = new Map(resolveHabitGoals(preferences).map((goal) => [goal.habitKey, goal]));

  return GOAL_EDITOR_ORDER.reduce((acc, habitKey) => {
    acc[habitKey] = formatGoalValue(resolved.get(habitKey)?.goalValue ?? 0);
    return acc;
  }, {} as HabitGoalInputMap);
};

export const buildGoalPreferencePatch = (values: HabitGoalInputMap): BuildGoalPatchResult => {
  const errors: HabitGoalValidationErrors = {};
  const goals = {} as Record<HabitKey, { value: number; unit: string }>;

  GOAL_EDITOR_ORDER.forEach((habitKey) => {
    const parsedValue = parseGoalInputValue(values[habitKey]);
    if (parsedValue === null) {
      errors[habitKey] = INVALID_GOAL_MESSAGE;
      return;
    }

    goals[habitKey] = {
      value: normalizeGoalValue(habitKey, parsedValue),
      unit: GOAL_UNITS[habitKey],
    };
  });

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      patch: null,
      errors,
    };
  }

  return {
    ok: true,
    patch: { goals },
    errors,
  };
};

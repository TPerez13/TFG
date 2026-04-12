import type { HabitEntry, HabitNotificationKey } from "./index";

export type GoalHabitKey = "agua" | "comidas" | "ejercicio" | "sueno" | "meditacion";
export type ReminderPolicyKind = "goal_based" | "schedule_based";

export type DailyGoalDefinition = {
  habitKey: GoalHabitKey;
  notificationKey: HabitNotificationKey;
  typeId: number;
  defaultGoalValue: number;
  defaultGoalUnit: string;
  reminderPolicy: ReminderPolicyKind;
};

export type DailyGoalTarget = {
  value: number;
  unit: string;
};

export type DailyGoalEvaluation = {
  habitKey: GoalHabitKey;
  notificationKey: HabitNotificationKey;
  typeId: number;
  reminderPolicy: ReminderPolicyKind;
  dayKey: string;
  total: number;
  target: number;
  unit: string;
  remaining: number;
  reached: boolean;
  progress: number;
  entriesCount: number;
};

type DailyGoalEvaluationInput = {
  habitKey: GoalHabitKey;
  entries: HabitEntry[];
  preferences?: unknown;
  date?: Date;
};

const ML_PER_GLASS = 250;

const DAILY_GOAL_DEFINITIONS: DailyGoalDefinition[] = [
  {
    habitKey: "agua",
    notificationKey: "hidratacion",
    typeId: 1,
    defaultGoalValue: 2000,
    defaultGoalUnit: "ml",
    reminderPolicy: "goal_based",
  },
  {
    habitKey: "comidas",
    notificationKey: "nutricion",
    typeId: 2,
    defaultGoalValue: 4,
    defaultGoalUnit: "platos",
    reminderPolicy: "goal_based",
  },
  {
    habitKey: "ejercicio",
    notificationKey: "ejercicio",
    typeId: 3,
    defaultGoalValue: 45,
    defaultGoalUnit: "min",
    reminderPolicy: "goal_based",
  },
  {
    habitKey: "sueno",
    notificationKey: "sueno",
    typeId: 4,
    defaultGoalValue: 8,
    defaultGoalUnit: "h",
    reminderPolicy: "schedule_based",
  },
  {
    habitKey: "meditacion",
    notificationKey: "meditacion",
    typeId: 5,
    defaultGoalValue: 10,
    defaultGoalUnit: "min",
    reminderPolicy: "goal_based",
  },
] as const;

export const GOAL_BASED_NOTIFICATION_KEYS = DAILY_GOAL_DEFINITIONS.filter(
  (item) => item.reminderPolicy === "goal_based"
).map((item) => item.notificationKey);

const DAILY_GOAL_BY_HABIT = new Map<GoalHabitKey, DailyGoalDefinition>(
  DAILY_GOAL_DEFINITIONS.map((item) => [item.habitKey, item])
);

const DAILY_GOAL_BY_NOTIFICATION = new Map<HabitNotificationKey, DailyGoalDefinition>(
  DAILY_GOAL_DEFINITIONS.map((item) => [item.notificationKey, item])
);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const normalizeUnit = (unit?: string | null) => `${unit ?? ""}`.trim().toLowerCase();

const dateToLocalKey = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toHydrationMl = (entry: HabitEntry) => {
  const value = Number(entry.valor) || 0;
  if (!value) return 0;

  const unit = normalizeUnit(entry.unidad);
  if (unit === "ml") return value;
  if (unit === "l" || unit === "litro" || unit === "litros") return value * 1000;
  if (unit === "vaso" || unit === "vasos") return value * ML_PER_GLASS;
  if (value > 30) return value;
  return value * ML_PER_GLASS;
};

const toHydrationGoalUnit = (ml: number, goalUnit?: string | null) => {
  const unit = normalizeUnit(goalUnit);
  if (unit === "l" || unit === "litro" || unit === "litros") return ml / 1000;
  if (unit.includes("vaso")) return ml / ML_PER_GLASS;
  return ml;
};

const toDurationGoalUnit = (minutes: number, goalUnit?: string | null) => {
  const unit = normalizeUnit(goalUnit);
  if (unit === "h" || unit === "hr" || unit === "hora" || unit === "horas") return minutes / 60;
  return minutes;
};

const toSleepGoalUnit = (hours: number, goalUnit?: string | null) => {
  const unit = normalizeUnit(goalUnit);
  if (unit === "min" || unit === "mins" || unit === "minuto" || unit === "minutos") return hours * 60;
  return hours;
};

const durationEntryToMinutes = (entry: HabitEntry) => {
  const value = Number(entry.valor) || 0;
  if (!value) return 0;
  const unit = normalizeUnit(entry.unidad) || "min";
  if (unit === "h" || unit === "hr" || unit === "hora" || unit === "horas") return value * 60;
  return value;
};

const sleepEntryToHours = (entry: HabitEntry) => {
  const value = Number(entry.valor) || 0;
  if (!value) return 0;
  const unit = normalizeUnit(entry.unidad) || "h";
  if (unit === "min" || unit === "mins" || unit === "minuto" || unit === "minutos") return value / 60;
  return value;
};

export const getDailyGoalDefinition = (habitKey: GoalHabitKey): DailyGoalDefinition => {
  const definition = DAILY_GOAL_BY_HABIT.get(habitKey);
  if (!definition) {
    throw new Error(`Unsupported goal habit: ${habitKey}`);
  }
  return definition;
};

export const getDailyGoalDefinitionByNotificationKey = (
  notificationKey: HabitNotificationKey
): DailyGoalDefinition => {
  const definition = DAILY_GOAL_BY_NOTIFICATION.get(notificationKey);
  if (!definition) {
    throw new Error(`Unsupported reminder habit: ${notificationKey}`);
  }
  return definition;
};

export const getGoalHabitKeyFromNotificationKey = (
  notificationKey: HabitNotificationKey
): GoalHabitKey => getDailyGoalDefinitionByNotificationKey(notificationKey).habitKey;

export const resolveDailyGoalTarget = (
  preferences: unknown,
  habitKey: GoalHabitKey
): DailyGoalTarget => {
  const definition = getDailyGoalDefinition(habitKey);
  const prefs = asRecord(preferences);
  const goals = asRecord(prefs?.goals);
  const rawGoal = asRecord(goals?.[habitKey]);
  const rawValue = Number(rawGoal?.value);

  return {
    value:
      Number.isFinite(rawValue) && rawValue > 0 ? rawValue : definition.defaultGoalValue,
    unit:
      typeof rawGoal?.unit === "string" && rawGoal.unit.trim()
        ? rawGoal.unit
        : definition.defaultGoalUnit,
  };
};

export const normalizeDailyGoalEntryValue = (
  habitKey: GoalHabitKey,
  entry: HabitEntry,
  goalUnit?: string | null
) => {
  if (habitKey === "agua") {
    return toHydrationGoalUnit(toHydrationMl(entry), goalUnit);
  }

  if (habitKey === "ejercicio" || habitKey === "meditacion") {
    return toDurationGoalUnit(durationEntryToMinutes(entry), goalUnit);
  }

  if (habitKey === "sueno") {
    return toSleepGoalUnit(sleepEntryToHours(entry), goalUnit);
  }

  return Number(entry.valor) || 0;
};

export const evaluateDailyGoal = ({
  habitKey,
  entries,
  preferences,
  date = new Date(),
}: DailyGoalEvaluationInput): DailyGoalEvaluation => {
  const definition = getDailyGoalDefinition(habitKey);
  const target = resolveDailyGoalTarget(preferences, habitKey);
  const dayKey = dateToLocalKey(date);
  const matchingEntries = entries.filter((entry) => {
    if (entry.id_tipo_habito !== definition.typeId) return false;
    const parsed = new Date(entry.f_registro);
    if (Number.isNaN(parsed.getTime())) return false;
    return dateToLocalKey(parsed) === dayKey;
  });

  const total = matchingEntries.reduce(
    (sum, entry) => sum + normalizeDailyGoalEntryValue(habitKey, entry, target.unit),
    0
  );
  const reached = target.value > 0 ? total >= target.value : false;
  const remaining = Math.max(target.value - total, 0);
  const progress = target.value > 0 ? clamp(total / target.value, 0, 1) : 0;

  return {
    habitKey,
    notificationKey: definition.notificationKey,
    typeId: definition.typeId,
    reminderPolicy: definition.reminderPolicy,
    dayKey,
    total,
    target: target.value,
    unit: target.unit,
    remaining,
    reached,
    progress,
    entriesCount: matchingEntries.length,
  };
};

export const buildGoalBasedDailyEvaluations = (input: {
  entries: HabitEntry[];
  preferences?: unknown;
  date?: Date;
}): Partial<Record<HabitNotificationKey, DailyGoalEvaluation>> => {
  const result: Partial<Record<HabitNotificationKey, DailyGoalEvaluation>> = {};

  GOAL_BASED_NOTIFICATION_KEYS.forEach((notificationKey) => {
    const habitKey = getGoalHabitKeyFromNotificationKey(notificationKey);
    result[notificationKey] = evaluateDailyGoal({
      habitKey,
      entries: input.entries,
      preferences: input.preferences,
      date: input.date,
    });
  });

  return result;
};

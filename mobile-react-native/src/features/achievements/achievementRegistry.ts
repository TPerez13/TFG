import type { HabitEntry } from '../../types/models';
import { parseIsoDateKey } from './calendarUtils';

const STREAK_3_TARGET = 3;
const STREAK_7_TARGET = 7;
const WEEKLY_TARGET_RATE = 0.8;
const MONTHLY_TARGET_RATE = 0.7;
const HABIT_MASTER_TARGET = 30;

export type AchievementId =
  | 'FIRST_ENTRY'
  | 'STREAK_3'
  | 'STREAK_7'
  | 'PERFECT_DAY'
  | 'WEEK_80'
  | 'MONTH_70'
  | 'HABIT_MASTER';

export type AchievementGoal = {
  typeId: number;
  goalValue: number;
};

export type AchievementProgress = {
  current: number;
  target: number;
};

export type AchievementItem = {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress?: AchievementProgress;
};

export type AchievementEvaluationContext = {
  sortedEntries: HabitEntry[];
  goals: AchievementGoal[];
  allDayKeys: string[];
  dayKeysWithEntries: string[];
  dayTotalsByType: Map<string, Map<number, number>>;
  dayMetHabitsCount: Map<string, number>;
  dayCompletionRatio: Map<string, number>;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const dayDiff = (leftDayKey: string, rightDayKey: string) => {
  const left = parseIsoDateKey(leftDayKey).getTime();
  const right = parseIsoDateKey(rightDayKey).getTime();
  return Math.round((right - left) / (24 * 60 * 60 * 1000));
};

const evaluateStreak = (dayKeys: string[], target: number) => {
  let maxStreak = 0;
  let currentStreak = 0;
  let previous: string | null = null;
  let unlockedAt: string | null = null;

  dayKeys.forEach((dayKey) => {
    if (previous && dayDiff(previous, dayKey) === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    previous = dayKey;
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
    if (!unlockedAt && currentStreak >= target) {
      unlockedAt = dayKey;
    }
  });

  return { maxStreak, unlockedAt };
};

const evaluateWeeklyAchievement = (context: AchievementEvaluationContext) => {
  const ratios = context.allDayKeys.map((dayKey) => context.dayCompletionRatio.get(dayKey) ?? 0);
  if (!ratios.length) {
    return {
      maxRate: 0,
      unlockedAt: null as string | null,
    };
  }

  const windowSize = 7;
  let windowSum = 0;
  let maxRate = 0;
  let unlockedAt: string | null = null;

  ratios.forEach((ratio, index) => {
    windowSum += ratio;
    if (index >= windowSize) {
      windowSum -= ratios[index - windowSize];
    }

    if (index < windowSize - 1) {
      return;
    }

    const windowRate = windowSum / windowSize;
    if (windowRate > maxRate) {
      maxRate = windowRate;
    }
    if (!unlockedAt && windowRate >= WEEKLY_TARGET_RATE) {
      unlockedAt = context.allDayKeys[index];
    }
  });

  return {
    maxRate,
    unlockedAt,
  };
};

const evaluateMonthlyAchievement = (context: AchievementEvaluationContext) => {
  const monthToDayKeys = new Map<string, string[]>();

  context.allDayKeys.forEach((dayKey) => {
    const monthKey = dayKey.slice(0, 7);
    const dayList = monthToDayKeys.get(monthKey) ?? [];
    dayList.push(dayKey);
    monthToDayKeys.set(monthKey, dayList);
  });

  const orderedMonthKeys = [...monthToDayKeys.keys()].sort();
  let maxRate = 0;
  let unlockedAt: string | null = null;

  orderedMonthKeys.forEach((monthKey) => {
    const dayKeys = monthToDayKeys.get(monthKey) ?? [];
    if (!dayKeys.length) return;

    const sum = dayKeys.reduce(
      (total, dayKey) => total + (context.dayCompletionRatio.get(dayKey) ?? 0),
      0,
    );
    const rate = sum / dayKeys.length;

    if (rate > maxRate) {
      maxRate = rate;
    }
    if (!unlockedAt && rate >= MONTHLY_TARGET_RATE) {
      unlockedAt = dayKeys[dayKeys.length - 1] ?? null;
    }
  });

  return { maxRate, unlockedAt };
};

const evaluateHabitMaster = (context: AchievementEvaluationContext) => {
  const completionsByHabit = new Map<number, number>();
  let topCompletion = 0;
  let unlockedAt: string | null = null;

  context.allDayKeys.forEach((dayKey) => {
    const totals = context.dayTotalsByType.get(dayKey);
    if (!totals) return;

    context.goals.forEach((goal) => {
      const dailyTotal = totals.get(goal.typeId) ?? 0;
      if (dailyTotal < goal.goalValue) return;

      const nextCount = (completionsByHabit.get(goal.typeId) ?? 0) + 1;
      completionsByHabit.set(goal.typeId, nextCount);

      if (nextCount > topCompletion) {
        topCompletion = nextCount;
      }
      if (!unlockedAt && nextCount >= HABIT_MASTER_TARGET) {
        unlockedAt = dayKey;
      }
    });
  });

  return { topCompletion, unlockedAt };
};

export const evaluateAchievements = (context: AchievementEvaluationContext): AchievementItem[] => {
  const firstEntryAt = context.dayKeysWithEntries[0] ?? null;

  const streak3 = evaluateStreak(context.dayKeysWithEntries, STREAK_3_TARGET);
  const streak7 = evaluateStreak(context.dayKeysWithEntries, STREAK_7_TARGET);

  const goalsCount = context.goals.length;
  let firstPerfectDay: string | null = null;
  let maxMetHabitsInDay = 0;

  context.allDayKeys.forEach((dayKey) => {
    const metHabits = context.dayMetHabitsCount.get(dayKey) ?? 0;
    if (metHabits > maxMetHabitsInDay) {
      maxMetHabitsInDay = metHabits;
    }
    if (!firstPerfectDay && goalsCount > 0 && metHabits >= goalsCount) {
      firstPerfectDay = dayKey;
    }
  });

  const week80 = evaluateWeeklyAchievement(context);
  const month70 = evaluateMonthlyAchievement(context);
  const habitMaster = evaluateHabitMaster(context);

  return [
    {
      id: 'FIRST_ENTRY',
      title: 'Primer registro',
      description: 'Registra tu primer avance en un habito.',
      icon: 'sparkles-outline',
      unlocked: Boolean(firstEntryAt),
      unlockedAt: firstEntryAt,
      progress: {
        current: firstEntryAt ? 1 : 0,
        target: 1,
      },
    },
    {
      id: 'STREAK_3',
      title: 'Racha de 3 dias',
      description: 'Registra actividad durante 3 dias consecutivos.',
      icon: 'flame-outline',
      unlocked: Boolean(streak3.unlockedAt),
      unlockedAt: streak3.unlockedAt,
      progress: {
        current: clamp(streak3.maxStreak, 0, STREAK_3_TARGET),
        target: STREAK_3_TARGET,
      },
    },
    {
      id: 'STREAK_7',
      title: 'Racha de 7 dias',
      description: 'Mantiene una racha de una semana completa.',
      icon: 'flame',
      unlocked: Boolean(streak7.unlockedAt),
      unlockedAt: streak7.unlockedAt,
      progress: {
        current: clamp(streak7.maxStreak, 0, STREAK_7_TARGET),
        target: STREAK_7_TARGET,
      },
    },
    {
      id: 'PERFECT_DAY',
      title: 'Dia perfecto',
      description: 'Cumple todos los habitos objetivo en un mismo dia.',
      icon: 'star-outline',
      unlocked: Boolean(firstPerfectDay),
      unlockedAt: firstPerfectDay,
      progress: {
        current: clamp(maxMetHabitsInDay, 0, Math.max(1, goalsCount)),
        target: Math.max(1, goalsCount),
      },
    },
    {
      id: 'WEEK_80',
      title: 'Semana constante',
      description: 'Consigue al menos 80% de cumplimiento en una ventana de 7 dias.',
      icon: 'calendar-outline',
      unlocked: Boolean(week80.unlockedAt),
      unlockedAt: week80.unlockedAt,
      progress: {
        current: Math.round(clamp(week80.maxRate, 0, 1) * 100),
        target: 80,
      },
    },
    {
      id: 'MONTH_70',
      title: 'Mes consistente',
      description: 'Alcanza 70% de cumplimiento promedio en un mes.',
      icon: 'trophy-outline',
      unlocked: Boolean(month70.unlockedAt),
      unlockedAt: month70.unlockedAt,
      progress: {
        current: Math.round(clamp(month70.maxRate, 0, 1) * 100),
        target: 70,
      },
    },
    {
      id: 'HABIT_MASTER',
      title: 'Maestro del habito',
      description: `Cumple un mismo habito ${HABIT_MASTER_TARGET} veces.`,
      icon: 'medal-outline',
      unlocked: Boolean(habitMaster.unlockedAt),
      unlockedAt: habitMaster.unlockedAt,
      progress: {
        current: clamp(habitMaster.topCompletion, 0, HABIT_MASTER_TARGET),
        target: HABIT_MASTER_TARGET,
      },
    },
  ];
};

import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementCriteria,
  type AchievementId,
  type AchievementProgress,
} from "@muchasvidas/shared";
import type { HabitEntryRecord } from "../models/habitModel";

type AchievementGoal = {
  typeId: number;
  goalValue: number;
};

type AchievementEvaluation = {
  id: AchievementId;
  unlockedAt: string | null;
  progress: AchievementProgress;
};

type AchievementEvaluationContext = {
  allDayKeys: string[];
  completionTimelineByType: Map<number, string[]>;
  dayCompletionRatio: Map<string, number>;
  dayKeysWithEntries: string[];
  dayLatestAt: Map<string, string>;
  firstEntryAtByType: Map<number, string>;
  goals: AchievementGoal[];
  perfectDayTimestamps: string[];
  sortedEntries: HabitEntryRecord[];
  totalEntries: number;
  topHabitCompletionCount: number;
};

const CORE_GOAL_CONFIG = [
  { prefKey: "agua", typeId: 1, fallback: 2000 },
  { prefKey: "comidas", typeId: 2, fallback: 4 },
  { prefKey: "ejercicio", typeId: 3, fallback: 45 },
  { prefKey: "sueno", typeId: 4, fallback: 8 },
  { prefKey: "meditacion", typeId: 5, fallback: 10 },
] as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const addDays = (value: Date, amount: number) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate() + amount, 12, 0, 0, 0);

const parseDayKey = (dayKey: string) => {
  const [year, month, day] = dayKey.split("-").map((part) => Number(part));
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0);
};

const toLocalDayKey = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dayDiff = (leftDayKey: string, rightDayKey: string) => {
  const left = parseDayKey(leftDayKey).getTime();
  const right = parseDayKey(rightDayKey).getTime();
  return Math.round((right - left) / (24 * 60 * 60 * 1000));
};

const toAchievementTimestamp = (
  dayKey: string,
  dayLatestAt: Map<string, string>
): string => {
  const latest = dayLatestAt.get(dayKey);
  if (latest && !Number.isNaN(new Date(latest).getTime())) {
    return new Date(latest).toISOString();
  }
  return parseDayKey(dayKey).toISOString();
};

const resolveAchievementGoals = (preferences: unknown): AchievementGoal[] => {
  const prefs = asRecord(preferences);
  const goals = asRecord(prefs?.goals);

  return CORE_GOAL_CONFIG.map((item) => {
    const rawGoal = asRecord(goals?.[item.prefKey]);
    const rawValue = Number(rawGoal?.value);
    return {
      typeId: item.typeId,
      goalValue: Number.isFinite(rawValue) && rawValue > 0 ? rawValue : item.fallback,
    };
  });
};

const sortEntriesAsc = (entries: HabitEntryRecord[]) =>
  [...entries].sort(
    (left, right) =>
      new Date(left.f_registro).getTime() - new Date(right.f_registro).getTime()
  );

const evaluateStreak = (
  dayKeys: string[],
  target: number,
  dayLatestAt: Map<string, string>
) => {
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
      unlockedAt = toAchievementTimestamp(dayKey, dayLatestAt);
    }
  });

  return { maxStreak, unlockedAt };
};

const evaluateWeeklyAchievement = (
  context: AchievementEvaluationContext,
  criteria: Extract<AchievementCriteria, { type: "week_completion" }>
) => {
  const ratios = context.allDayKeys.map((dayKey) => context.dayCompletionRatio.get(dayKey) ?? 0);
  if (!ratios.length) {
    return {
      maxRate: 0,
      unlockedAt: null as string | null,
    };
  }

  let windowSum = 0;
  let maxRate = 0;
  let unlockedAt: string | null = null;

  ratios.forEach((ratio, index) => {
    windowSum += ratio;
    if (index >= criteria.windowDays) {
      windowSum -= ratios[index - criteria.windowDays];
    }

    if (index < criteria.windowDays - 1) {
      return;
    }

    const windowRate = windowSum / criteria.windowDays;
    if (windowRate > maxRate) {
      maxRate = windowRate;
    }
    if (!unlockedAt && windowRate >= criteria.targetPct / 100) {
      unlockedAt = toAchievementTimestamp(context.allDayKeys[index], context.dayLatestAt);
    }
  });

  return {
    maxRate,
    unlockedAt,
  };
};

const evaluateMonthlyAchievement = (
  context: AchievementEvaluationContext,
  criteria: Extract<AchievementCriteria, { type: "month_completion" }>
) => {
  const monthToDayKeys = new Map<string, string[]>();

  context.allDayKeys.forEach((dayKey) => {
    const monthKey = dayKey.slice(0, 7);
    const list = monthToDayKeys.get(monthKey) ?? [];
    list.push(dayKey);
    monthToDayKeys.set(monthKey, list);
  });

  let maxRate = 0;
  let unlockedAt: string | null = null;

  [...monthToDayKeys.keys()]
    .sort()
    .forEach((monthKey) => {
      const dayKeys = monthToDayKeys.get(monthKey) ?? [];
      if (!dayKeys.length) {
        return;
      }

      const ratioSum = dayKeys.reduce(
        (total, dayKey) => total + (context.dayCompletionRatio.get(dayKey) ?? 0),
        0
      );
      const rate = ratioSum / dayKeys.length;

      if (rate > maxRate) {
        maxRate = rate;
      }
      if (!unlockedAt && rate >= criteria.targetPct / 100) {
        const lastDayKey = dayKeys[dayKeys.length - 1];
        unlockedAt = toAchievementTimestamp(lastDayKey, context.dayLatestAt);
      }
    });

  return { maxRate, unlockedAt };
};

const getNthTimestamp = (
  timestamps: string[] | undefined,
  target: number
): string | null => {
  if (!timestamps || timestamps.length < target || target <= 0) {
    return null;
  }
  return timestamps[target - 1] ?? null;
};

const resolveEarliestTimestamp = (candidates: Array<string | null>): string | null => {
  const valid = candidates.filter(
    (candidate): candidate is string => Boolean(candidate && !Number.isNaN(new Date(candidate).getTime()))
  );

  if (!valid.length) {
    return null;
  }

  return [...valid].sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];
};

const buildAchievementContext = (
  entries: HabitEntryRecord[],
  preferences: unknown
): AchievementEvaluationContext => {
  const sortedEntries = sortEntriesAsc(entries).filter(
    (entry) => !Number.isNaN(new Date(entry.f_registro).getTime())
  );
  const goals = resolveAchievementGoals(preferences);
  const dayTotalsByType = new Map<string, Map<number, number>>();
  const dayLatestAt = new Map<string, string>();
  const firstEntryAtByType = new Map<number, string>();

  sortedEntries.forEach((entry) => {
    const parsed = new Date(entry.f_registro);
    const dayKey = toLocalDayKey(parsed);
    const dayTotals = dayTotalsByType.get(dayKey) ?? new Map<number, number>();
    dayTotals.set(
      entry.id_tipo_habito,
      (dayTotals.get(entry.id_tipo_habito) ?? 0) + (Number(entry.valor) || 0)
    );
    dayTotalsByType.set(dayKey, dayTotals);

    const iso = parsed.toISOString();
    const currentLatest = dayLatestAt.get(dayKey);
    if (!currentLatest || new Date(currentLatest).getTime() < parsed.getTime()) {
      dayLatestAt.set(dayKey, iso);
    }

    if (!firstEntryAtByType.has(entry.id_tipo_habito)) {
      firstEntryAtByType.set(entry.id_tipo_habito, iso);
    }
  });

  const dayKeysWithEntries = [...dayTotalsByType.keys()].sort();
  const allDayKeys: string[] = [];

  if (dayKeysWithEntries.length > 0) {
    const firstDay = parseDayKey(dayKeysWithEntries[0]);
    const lastDay = parseDayKey(dayKeysWithEntries[dayKeysWithEntries.length - 1]);

    for (
      let cursor = firstDay;
      cursor.getTime() <= lastDay.getTime();
      cursor = addDays(cursor, 1)
    ) {
      allDayKeys.push(toLocalDayKey(cursor));
    }
  }

  const completionTimelineByType = new Map<number, string[]>();
  goals.forEach((goal) => {
    completionTimelineByType.set(goal.typeId, []);
  });

  const perfectDayTimestamps: string[] = [];
  const dayCompletionRatio = new Map<string, number>();
  const goalsCount = goals.length;

  allDayKeys.forEach((dayKey) => {
    const totals = dayTotalsByType.get(dayKey);
    let metHabits = 0;

    if (totals && goalsCount > 0) {
      goals.forEach((goal) => {
        if ((totals.get(goal.typeId) ?? 0) >= goal.goalValue) {
          metHabits += 1;
          const timeline = completionTimelineByType.get(goal.typeId) ?? [];
          timeline.push(toAchievementTimestamp(dayKey, dayLatestAt));
          completionTimelineByType.set(goal.typeId, timeline);
        }
      });
    }

    if (goalsCount > 0 && metHabits >= goalsCount) {
      perfectDayTimestamps.push(toAchievementTimestamp(dayKey, dayLatestAt));
    }

    dayCompletionRatio.set(dayKey, goalsCount > 0 ? metHabits / goalsCount : 0);
  });

  const topHabitCompletionCount = Math.max(
    0,
    ...[...completionTimelineByType.values()].map((timeline) => timeline.length)
  );

  return {
    allDayKeys,
    completionTimelineByType,
    dayCompletionRatio,
    dayKeysWithEntries,
    dayLatestAt,
    firstEntryAtByType,
    goals,
    perfectDayTimestamps,
    sortedEntries,
    totalEntries: sortedEntries.length,
    topHabitCompletionCount,
  };
};

const evaluateAchievementByCriteria = (
  criteria: AchievementCriteria,
  context: AchievementEvaluationContext
): Omit<AchievementEvaluation, "id"> => {
  switch (criteria.type) {
    case "first_entry": {
      const firstEntryAt =
        context.sortedEntries[0] &&
        !Number.isNaN(new Date(context.sortedEntries[0].f_registro).getTime())
          ? new Date(context.sortedEntries[0].f_registro).toISOString()
          : null;

      return {
        unlockedAt: firstEntryAt,
        progress: {
          current: firstEntryAt ? 1 : 0,
          target: criteria.target,
        },
      };
    }

    case "first_habit_entry": {
      const unlockedAt = context.firstEntryAtByType.get(criteria.habitTypeId) ?? null;
      return {
        unlockedAt,
        progress: {
          current: unlockedAt ? 1 : 0,
          target: criteria.target,
        },
      };
    }

    case "total_entries": {
      const unlockedAt =
        context.totalEntries >= criteria.target
          ? new Date(context.sortedEntries[criteria.target - 1].f_registro).toISOString()
          : null;

      return {
        unlockedAt,
        progress: {
          current: clamp(context.totalEntries, 0, criteria.target),
          target: criteria.target,
        },
      };
    }

    case "streak": {
      const streak = evaluateStreak(context.dayKeysWithEntries, criteria.target, context.dayLatestAt);
      return {
        unlockedAt: streak.unlockedAt,
        progress: {
          current: clamp(streak.maxStreak, 0, criteria.target),
          target: criteria.target,
        },
      };
    }

    case "perfect_day": {
      return {
        unlockedAt: getNthTimestamp(context.perfectDayTimestamps, criteria.target),
        progress: {
          current: clamp(context.perfectDayTimestamps.length, 0, criteria.target),
          target: criteria.target,
        },
      };
    }

    case "week_completion": {
      const weekly = evaluateWeeklyAchievement(context, criteria);
      return {
        unlockedAt: weekly.unlockedAt,
        progress: {
          current: Math.round(clamp(weekly.maxRate, 0, 1) * 100),
          target: criteria.targetPct,
        },
      };
    }

    case "month_completion": {
      const monthly = evaluateMonthlyAchievement(context, criteria);
      return {
        unlockedAt: monthly.unlockedAt,
        progress: {
          current: Math.round(clamp(monthly.maxRate, 0, 1) * 100),
          target: criteria.targetPct,
        },
      };
    }

    case "habit_master": {
      const unlockedAt = resolveEarliestTimestamp(
        [...context.completionTimelineByType.values()].map((timeline) =>
          getNthTimestamp(timeline, criteria.target)
        )
      );

      return {
        unlockedAt,
        progress: {
          current: clamp(context.topHabitCompletionCount, 0, criteria.target),
          target: criteria.target,
        },
      };
    }

    case "habit_completion": {
      const timeline = context.completionTimelineByType.get(criteria.habitTypeId) ?? [];
      return {
        unlockedAt: getNthTimestamp(timeline, criteria.target),
        progress: {
          current: clamp(timeline.length, 0, criteria.target),
          target: criteria.target,
        },
      };
    }

    default: {
      const exhaustiveCheck: never = criteria;
      throw new Error(`Unsupported achievement criteria: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};

export function evaluateAchievements(
  entries: HabitEntryRecord[],
  preferences: unknown
): AchievementEvaluation[] {
  const context = buildAchievementContext(entries, preferences);

  return ACHIEVEMENT_DEFINITIONS.map((definition) => ({
    id: definition.id,
    ...evaluateAchievementByCriteria(definition.criteria, context),
  }));
}

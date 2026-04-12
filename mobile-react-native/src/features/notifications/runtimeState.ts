import {
  buildGoalBasedDailyEvaluations,
  getHabitReminderPolicy,
  type DailyGoalEvaluation,
} from '@muchasvidas/shared';
import type { HabitEntry, User } from '../../types/models';
import type { HabitNotificationKey, NotificationSettings } from './types';

export type HabitReminderRuntimeState = Partial<
  Record<
    HabitNotificationKey,
    {
      goalEvaluation?: DailyGoalEvaluation;
    }
  >
>;

export const needsGoalEvaluation = (settings: NotificationSettings) =>
  Object.entries(settings.habits).some(([habitKey, config]) => {
    if (!config.enabled) return false;
    return getHabitReminderPolicy(habitKey as HabitNotificationKey).kind === 'goal_based';
  });

export const buildHabitReminderRuntimeState = (
  entries: HabitEntry[],
  user: Pick<User, 'preferencias'> | null | undefined,
  date = new Date(),
): HabitReminderRuntimeState => {
  const evaluations = buildGoalBasedDailyEvaluations({
    entries,
    preferences: user?.preferencias ?? null,
    date,
  });

  const result: HabitReminderRuntimeState = {};
  Object.entries(evaluations).forEach(([habitKey, evaluation]) => {
    if (!evaluation) return;
    result[habitKey as HabitNotificationKey] = {
      goalEvaluation: evaluation,
    };
  });

  return result;
};

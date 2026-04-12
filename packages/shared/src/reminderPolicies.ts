import type { HabitNotificationKey } from "./index";
import type { DailyGoalEvaluation, GoalHabitKey, ReminderPolicyKind } from "./dailyGoals";
import { getDailyGoalDefinitionByNotificationKey } from "./dailyGoals";

export type HabitReminderPolicy = {
  notificationKey: HabitNotificationKey;
  habitKey: GoalHabitKey;
  kind: ReminderPolicyKind;
};

type ReminderSchedulingInput = {
  notificationKey: HabitNotificationKey;
  evaluation?: DailyGoalEvaluation | null;
};

export const getHabitReminderPolicy = (
  notificationKey: HabitNotificationKey
): HabitReminderPolicy => {
  const definition = getDailyGoalDefinitionByNotificationKey(notificationKey);
  return {
    notificationKey,
    habitKey: definition.habitKey,
    kind: definition.reminderPolicy,
  };
};

export const shouldScheduleHabitReminder = ({
  notificationKey,
  evaluation,
}: ReminderSchedulingInput): boolean => {
  const policy = getHabitReminderPolicy(notificationKey);
  if (policy.kind === "schedule_based") {
    return true;
  }
  if (!evaluation) {
    return true;
  }
  return !evaluation.reached;
};

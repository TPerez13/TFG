import type { AchievementItem, AchievementListResponse } from "@muchasvidas/shared";
import { ACHIEVEMENT_DEFINITIONS } from "@muchasvidas/shared";
import {
  grantAchievementToUser,
  listUnlockedAchievementsForUser,
  syncAchievementCatalog,
} from "../models/achievementModel";
import { listAllEntriesForUser } from "../models/habitModel";
import { findById } from "../models/userModel";
import { AppError } from "../utils/errors";
import { evaluateAchievements } from "./achievementEvaluator";

const toIsoString = (value: string | Date) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const fillCompletedProgress = (target: number) => ({
  current: target,
  target,
});

export async function getAchievementsForUser(
  userId: number
): Promise<AchievementListResponse> {
  const user = await findById(userId);
  if (!user) {
    throw new AppError("Usuario no encontrado.", 404);
  }

  await syncAchievementCatalog(ACHIEVEMENT_DEFINITIONS);

  const [entries, persistedBefore] = await Promise.all([
    listAllEntriesForUser(userId),
    listUnlockedAchievementsForUser(userId),
  ]);
  const evaluated = evaluateAchievements(entries, user.preferencias);
  const persistedIds = new Set(persistedBefore.map((item) => item.achievementId));

  for (const achievement of evaluated) {
    if (!achievement.unlockedAt || persistedIds.has(achievement.id)) {
      continue;
    }

    const definition = ACHIEVEMENT_DEFINITIONS.find((item) => item.id === achievement.id);
    if (!definition) {
      continue;
    }

    const inserted = await grantAchievementToUser(
      userId,
      achievement.id,
      achievement.unlockedAt,
      definition.points
    );
    if (inserted) {
      persistedIds.add(achievement.id);
    }
  }

  const persistedAfter = await listUnlockedAchievementsForUser(userId);
  const persistedMap = new Map(
    persistedAfter.map((item) => [item.achievementId, toIsoString(item.unlockedAt)])
  );
  const evaluatedMap = new Map(evaluated.map((item) => [item.id, item]));

  const achievements: AchievementItem[] = ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const evaluatedAchievement = evaluatedMap.get(definition.id);
    const persistedUnlockedAt = persistedMap.get(definition.id) ?? null;
    const unlocked = Boolean(persistedUnlockedAt || evaluatedAchievement?.unlockedAt);
    const progress = evaluatedAchievement?.progress ?? {
      current: 0,
      target: 1,
    };

    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      points: definition.points,
      difficulty: definition.difficulty,
      sharePriority: definition.sharePriority,
      unlocked,
      unlockedAt: persistedUnlockedAt ?? evaluatedAchievement?.unlockedAt ?? null,
      progress: unlocked ? fillCompletedProgress(progress.target) : progress,
    };
  });

  return { achievements };
}

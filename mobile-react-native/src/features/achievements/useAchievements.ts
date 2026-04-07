import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AchievementItem, AchievementListResponse } from '../../types/models';
import { useAuth } from '../../navigation/AuthContext';
import { apiFetch } from '../../services/api';
import { toIsoDateKey } from './calendarUtils';

type UseAchievementsResult = {
  achievements: AchievementItem[];
  achievementsByDate: Record<string, AchievementItem[]>;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  isEmpty: boolean;
};

export type ClosestAchievementItem = AchievementItem & {
  progressCurrent: number;
  progressTarget: number;
  progressPct: number;
};

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? fallback;
  } catch {
    return fallback;
  }
};

const toDateKeyFromIso = (isoDate: string) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return toIsoDateKey(parsed);
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const selectClosestLockedAchievements = (
  achievements: AchievementItem[],
  limit = 3,
): ClosestAchievementItem[] => {
  const withProgress = achievements
    .map((achievement, index) => {
      const target = achievement.progress?.target ?? 0;
      const current = achievement.progress?.current ?? 0;
      if (achievement.unlocked || target <= 0) {
        return null;
      }
      const ratio = current / target;
      const progressPct = clamp(Number.isFinite(ratio) ? ratio : 0, 0, 1);
      return {
        ...achievement,
        progressCurrent: current,
        progressTarget: target,
        progressPct,
        _index: index,
      };
    })
    .filter((item): item is ClosestAchievementItem & { _index: number } => item !== null);

  withProgress.sort((left, right) => {
    if (right.progressPct !== left.progressPct) {
      return right.progressPct - left.progressPct;
    }
    return left._index - right._index;
  });

  return withProgress.slice(0, Math.max(1, limit)).map(({ _index, ...rest }) => rest);
};

export function useAchievements(_selectedMonth: Date): UseAchievementsResult {
  const { signOut } = useAuth();
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/achievements');
      if (response.status === 401) {
        await signOut();
        throw new Error('Tu sesión ha expirado.');
      }
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, 'No se pudieron cargar los logros.'));
      }

      const payload = (await response.json()) as AchievementListResponse;
      setAchievements(payload.achievements ?? []);
    } catch (loadError) {
      setAchievements([]);
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los logros.');
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const achievementsByDate = useMemo<Record<string, AchievementItem[]>>(() => {
    return achievements.reduce<Record<string, AchievementItem[]>>((map, achievement) => {
      if (!achievement.unlocked || !achievement.unlockedAt) return map;
      const dayKey = toDateKeyFromIso(achievement.unlockedAt);
      if (!dayKey) return map;
      const items = map[dayKey] ?? [];
      return {
        ...map,
        [dayKey]: [...items, achievement],
      };
    }, {});
  }, [achievements]);

  const isEmpty = useMemo(
    () =>
      achievements.length === 0 ||
      achievements.every(
        (achievement) =>
          !achievement.unlocked && (achievement.progress?.current ?? 0) === 0,
      ),
    [achievements],
  );

  return {
    achievements,
    achievementsByDate,
    loading,
    error,
    reload,
    isEmpty,
  };
}

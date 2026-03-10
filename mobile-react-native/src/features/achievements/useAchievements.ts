import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HabitEntry, User } from '../../types/models';
import { useAuth } from '../../navigation/AuthContext';
import { apiFetch } from '../../services/api';
import { fetchHabitEntries } from '../habits/entriesApi';
import { resolveHabitGoals } from '../progress/historyUtils';
import {
  evaluateAchievements,
  type AchievementEvaluationContext,
  type AchievementGoal,
  type AchievementItem,
} from './achievementRegistry';
import {
  addDays,
  endOfMonth,
  getMonthKey,
  parseIsoDateKey,
  startOfMonth,
  toIsoDateKey,
} from './calendarUtils';

type UseAchievementsResult = {
  achievements: AchievementItem[];
  achievementsByDate: Record<string, AchievementItem[]>;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  isEmpty: boolean;
};

const GLOBAL_LOOKBACK_DAYS = 365;
const MONTH_BUFFER_DAYS = 7;

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

const sortEntriesAsc = (entries: HabitEntry[]) =>
  [...entries].sort(
    (left, right) => new Date(left.f_registro).getTime() - new Date(right.f_registro).getTime(),
  );

export function useAchievements(selectedMonth: Date): UseAchievementsResult {
  const { signOut } = useAuth();
  const monthCacheRef = useRef(new Map<string, HabitEntry[]>());
  const [globalEntries, setGlobalEntries] = useState<HabitEntry[]>([]);
  const [monthEntries, setMonthEntries] = useState<HabitEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const fetchUser = useCallback(async () => {
    const response = await apiFetch('/users/me');
    if (response.status === 401) {
      await signOut();
      throw new Error('Tu sesion ha expirado.');
    }
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'No se pudo cargar tu perfil.'));
    }

    const payload = (await response.json()) as { user?: User };
    return payload.user ?? null;
  }, [signOut]);

  const fetchGlobalEntries = useCallback(async () => {
    const today = new Date();
    const start = addDays(today, -(GLOBAL_LOOKBACK_DAYS - 1));
    // Este calculo usa el historico disponible (365 dias + mes seleccionado en cache).
    return fetchHabitEntries({
      from: toIsoDateKey(start),
      to: toIsoDateKey(today),
    });
  }, []);

  const fetchMonthEntries = useCallback(async (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return fetchHabitEntries({
      from: toIsoDateKey(addDays(monthStart, -MONTH_BUFFER_DAYS)),
      to: toIsoDateKey(monthEnd),
    });
  }, []);

  const bootstrap = useCallback(
    async (month: Date, forceCacheReset = false) => {
      if (forceCacheReset) {
        monthCacheRef.current.clear();
      }

      setBootLoading(true);
      setError(null);
      try {
        const [entries365, me, monthHistory] = await Promise.all([
          fetchGlobalEntries(),
          fetchUser(),
          fetchMonthEntries(month),
        ]);
        const monthKey = getMonthKey(month);
        monthCacheRef.current.set(monthKey, monthHistory);
        setGlobalEntries(entries365);
        setMonthEntries(monthHistory);
        setUser(me);
        setIsBootstrapped(true);
      } catch (loadError) {
        setGlobalEntries([]);
        setMonthEntries([]);
        setUser(null);
        setIsBootstrapped(false);
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los logros.');
      } finally {
        setBootLoading(false);
      }
    },
    [fetchGlobalEntries, fetchMonthEntries, fetchUser],
  );

  useEffect(() => {
    void bootstrap(selectedMonth, true);
  }, [bootstrap]);

  useEffect(() => {
    if (!isBootstrapped) return;

    const monthKey = getMonthKey(selectedMonth);
    const cached = monthCacheRef.current.get(monthKey);
    if (cached) {
      setMonthEntries(cached);
      return;
    }

    let canceled = false;
    const loadMonth = async () => {
      setMonthLoading(true);
      setError(null);
      try {
        const entries = await fetchMonthEntries(selectedMonth);
        if (canceled) return;
        monthCacheRef.current.set(monthKey, entries);
        setMonthEntries(entries);
      } catch (loadError) {
        if (!canceled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los logros.');
        }
      } finally {
        if (!canceled) {
          setMonthLoading(false);
        }
      }
    };

    void loadMonth();

    return () => {
      canceled = true;
    };
  }, [fetchMonthEntries, isBootstrapped, selectedMonth]);

  const reload = useCallback(async () => {
    await bootstrap(selectedMonth, true);
  }, [bootstrap, selectedMonth]);

  const mergedEntries = useMemo(() => {
    const byId = new Map<number, HabitEntry>();
    [...globalEntries, ...monthEntries].forEach((entry) => {
      byId.set(entry.id_registro_habito, entry);
    });
    return sortEntriesAsc([...byId.values()]);
  }, [globalEntries, monthEntries]);

  const goals = useMemo<AchievementGoal[]>(
    () =>
      resolveHabitGoals(user?.preferencias ?? null)
        .filter((goal) => goal.typeId > 0 && goal.goalValue > 0)
        .map((goal) => ({
          typeId: goal.typeId,
          goalValue: goal.goalValue,
        })),
    [user?.preferencias],
  );

  const achievements = useMemo(() => {
    const dayTotalsByType = new Map<string, Map<number, number>>();

    mergedEntries.forEach((entry) => {
      const dayKey = toDateKeyFromIso(entry.f_registro);
      if (!dayKey) return;

      const totals = dayTotalsByType.get(dayKey) ?? new Map<number, number>();
      totals.set(entry.id_tipo_habito, (totals.get(entry.id_tipo_habito) ?? 0) + (Number(entry.valor) || 0));
      dayTotalsByType.set(dayKey, totals);
    });

    const dayKeysWithEntries = [...dayTotalsByType.keys()].sort();
    const allDayKeys: string[] = [];

    if (dayKeysWithEntries.length > 0) {
      const firstDay = parseIsoDateKey(dayKeysWithEntries[0]);
      const lastDay = parseIsoDateKey(dayKeysWithEntries[dayKeysWithEntries.length - 1]);

      for (
        let cursor = firstDay;
        cursor.getTime() <= lastDay.getTime();
        cursor = addDays(cursor, 1)
      ) {
        allDayKeys.push(toIsoDateKey(cursor));
      }
    }

    const dayMetHabitsCount = new Map<string, number>();
    const dayCompletionRatio = new Map<string, number>();
    const goalsCount = goals.length;

    allDayKeys.forEach((dayKey) => {
      const totals = dayTotalsByType.get(dayKey);
      let metHabits = 0;

      if (totals && goalsCount > 0) {
        goals.forEach((goal) => {
          const total = totals.get(goal.typeId) ?? 0;
          if (total >= goal.goalValue) {
            metHabits += 1;
          }
        });
      }

      dayMetHabitsCount.set(dayKey, metHabits);
      dayCompletionRatio.set(dayKey, goalsCount > 0 ? metHabits / goalsCount : 0);
    });

    const context: AchievementEvaluationContext = {
      sortedEntries: mergedEntries,
      goals,
      allDayKeys,
      dayKeysWithEntries,
      dayTotalsByType,
      dayMetHabitsCount,
      dayCompletionRatio,
    };

    return evaluateAchievements(context);
  }, [goals, mergedEntries]);

  const achievementsByDate = useMemo<Record<string, AchievementItem[]>>(() => {
    return achievements.reduce<Record<string, AchievementItem[]>>((map, achievement) => {
      if (!achievement.unlocked || !achievement.unlockedAt) return map;
      const items = map[achievement.unlockedAt] ?? [];
      return {
        ...map,
        [achievement.unlockedAt]: [...items, achievement],
      };
    }, {});
  }, [achievements]);

  return {
    achievements,
    achievementsByDate,
    loading: bootLoading || monthLoading,
    error,
    reload,
    isEmpty: mergedEntries.length === 0,
  };
}

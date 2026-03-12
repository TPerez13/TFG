import { useCallback, useEffect, useState } from 'react';
import type { HabitNotificationKey, HabitReminderDebugInfo, HabitReminderSnapshot } from './types';
import { getHabitReminderDebugInfo } from './localNotifications';

type UseHabitReminderDebugResult = {
  data: HabitReminderDebugInfo | null;
  loading: boolean;
  reload: () => Promise<void>;
};

const snapshotKey = (snapshot: HabitReminderSnapshot) =>
  [
    snapshot.globalEnabled ? '1' : '0',
    snapshot.quietHoursEnabled ? '1' : '0',
    snapshot.quietFrom,
    snapshot.quietTo,
    snapshot.habitEnabled ? '1' : '0',
    snapshot.time,
    snapshot.lastCompletedDate ?? 'null',
  ].join('|');

export function useHabitReminderDebug(
  habitKey: HabitNotificationKey,
  snapshot: HabitReminderSnapshot
): UseHabitReminderDebugResult {
  const [data, setData] = useState<HabitReminderDebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const snapshotToken = snapshotKey(snapshot);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const nextData = await getHabitReminderDebugInfo(habitKey, snapshot);
      setData(nextData);
    } finally {
      setLoading(false);
    }
  }, [habitKey, snapshotToken]);

  useEffect(() => {
    void reload();
  }, [reload, habitKey, snapshotToken]);

  return {
    data,
    loading,
    reload,
  };
}

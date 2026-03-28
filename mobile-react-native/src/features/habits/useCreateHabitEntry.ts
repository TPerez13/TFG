import { useState } from 'react';
import { createHabitEntry, type CreateHabitEntryPayload } from './entriesApi';
import type { HabitEntry } from '../../types/models';
import { syncLocalNotificationsWithServer } from '../notifications/api';

type UseCreateHabitEntryResult = {
  creating: boolean;
  createEntry: (payload: CreateHabitEntryPayload) => Promise<HabitEntry>;
};

export function useCreateHabitEntry(): UseCreateHabitEntryResult {
  const [creating, setCreating] = useState(false);

  const createEntry = async (payload: CreateHabitEntryPayload) => {
    setCreating(true);
    try {
      const entry = await createHabitEntry(payload);
      try {
        await syncLocalNotificationsWithServer({ requestPermissions: false });
      } catch {
        // La creación del registro no debe fallar por sincronización local.
      }
      return entry;
    } finally {
      setCreating(false);
    }
  };

  return { creating, createEntry };
}

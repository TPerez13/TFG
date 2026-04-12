import { useState } from 'react';
import type { HabitEntry } from '../../types/models';
import { syncLocalHabitReminders } from '../notifications/syncLocalReminders';
import { createHabitEntry, type CreateHabitEntryPayload } from './entriesApi';

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
      await syncLocalHabitReminders();
      return entry;
    } finally {
      setCreating(false);
    }
  };

  return { creating, createEntry };
}

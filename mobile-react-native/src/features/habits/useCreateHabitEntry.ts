import { useState } from 'react';
import { createHabitEntry, type CreateHabitEntryPayload } from './entriesApi';
import type { HabitEntry } from '../../types/models';

type UseCreateHabitEntryResult = {
  creating: boolean;
  createEntry: (payload: CreateHabitEntryPayload) => Promise<HabitEntry>;
};

export function useCreateHabitEntry(): UseCreateHabitEntryResult {
  const [creating, setCreating] = useState(false);

  const createEntry = async (payload: CreateHabitEntryPayload) => {
    setCreating(true);
    try {
      return await createHabitEntry(payload);
    } finally {
      setCreating(false);
    }
  };

  return { creating, createEntry };
}

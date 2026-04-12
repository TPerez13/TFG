import { useState } from 'react';
import { syncLocalHabitReminders } from '../notifications/syncLocalReminders';
import { createNutritionEntry, deleteNutritionEntry } from './api';
import type { CreateNutritionEntryPayload, NutritionEntry } from './types';

type UseNutritionMutationsResult = {
  creating: boolean;
  deleting: boolean;
  createEntry: (payload: CreateNutritionEntryPayload) => Promise<NutritionEntry>;
  deleteEntry: (entryId: number) => Promise<void>;
};

export function useNutritionMutations(): UseNutritionMutationsResult {
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const createEntry = async (payload: CreateNutritionEntryPayload) => {
    setCreating(true);
    try {
      const entry = await createNutritionEntry(payload);
      await syncLocalHabitReminders();
      return entry;
    } finally {
      setCreating(false);
    }
  };

  const deleteEntrySafe = async (entryId: number) => {
    setDeleting(true);
    try {
      await deleteNutritionEntry(entryId);
      await syncLocalHabitReminders();
    } finally {
      setDeleting(false);
    }
  };

  return {
    creating,
    deleting,
    createEntry,
    deleteEntry: deleteEntrySafe,
  };
}

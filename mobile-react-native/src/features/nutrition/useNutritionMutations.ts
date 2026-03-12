import { useState } from 'react';
import { createNutritionEntry, deleteNutritionEntry } from './api';
import type { CreateNutritionEntryPayload, NutritionEntry } from './types';
import { syncLocalNotificationsWithServer } from '../notifications/api';

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
      try {
        await syncLocalNotificationsWithServer({ requestPermissions: false });
      } catch {
        // La creacion del registro no debe fallar por sincronizacion local.
      }
      return entry;
    } finally {
      setCreating(false);
    }
  };

  const deleteEntrySafe = async (entryId: number) => {
    setDeleting(true);
    try {
      await deleteNutritionEntry(entryId);
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

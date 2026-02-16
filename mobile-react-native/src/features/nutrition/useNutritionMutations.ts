import { useState } from 'react';
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
      return await createNutritionEntry(payload);
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

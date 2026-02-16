import { useState } from 'react';
import { deleteHabitEntry } from './entriesApi';

type UseDeleteHabitEntryResult = {
  deleting: boolean;
  deleteEntry: (entryId: number) => Promise<void>;
};

export function useDeleteHabitEntry(): UseDeleteHabitEntryResult {
  const [deleting, setDeleting] = useState(false);

  const deleteEntry = async (entryId: number) => {
    setDeleting(true);
    try {
      await deleteHabitEntry(entryId);
    } finally {
      setDeleting(false);
    }
  };

  return { deleting, deleteEntry };
}

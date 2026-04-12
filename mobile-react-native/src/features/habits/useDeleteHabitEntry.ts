import { useState } from 'react';
import { deleteHabitEntryAndSyncReminders } from './deleteHabitEntryAction';

type UseDeleteHabitEntryResult = {
  deleting: boolean;
  deleteEntry: (entryId: number) => Promise<void>;
};

export function useDeleteHabitEntry(): UseDeleteHabitEntryResult {
  const [deleting, setDeleting] = useState(false);

  const deleteEntry = async (entryId: number) => {
    setDeleting(true);
    try {
      await deleteHabitEntryAndSyncReminders(entryId);
    } finally {
      setDeleting(false);
    }
  };

  return { deleting, deleteEntry };
}

import { syncLocalHabitReminders } from '../notifications/syncLocalReminders';
import { deleteHabitEntry as deleteHabitEntryRequest } from './entriesApi';

type DeleteHabitEntryDependencies = {
  deleteHabitEntry?: (entryId: number) => Promise<void>;
  syncLocalHabitReminders?: () => Promise<void>;
};

export async function deleteHabitEntryAndSyncReminders(
  entryId: number,
  dependencies: DeleteHabitEntryDependencies = {}
): Promise<void> {
  const deleteEntry = dependencies.deleteHabitEntry ?? deleteHabitEntryRequest;
  const syncReminders = dependencies.syncLocalHabitReminders ?? syncLocalHabitReminders;

  await deleteEntry(entryId);
  await syncReminders();
}

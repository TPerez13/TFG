import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deleteHabitEntryAndSyncReminders } from '../../src/features/habits/deleteHabitEntryAction';

describe('deleteHabitEntryAndSyncReminders', () => {
  it('deletes the entry before syncing local reminders', async () => {
    const calls: Array<[string, number?]> = [];

    await deleteHabitEntryAndSyncReminders(42, {
      deleteHabitEntry: async (entryId: number) => {
        calls.push(['delete', entryId]);
      },
      syncLocalHabitReminders: async () => {
        calls.push(['sync']);
      },
    });

    assert.deepEqual(calls, [
      ['delete', 42],
      ['sync'],
    ]);
  });

  it('propagates delete errors without syncing reminders afterwards', async () => {
    const calls: Array<[string, number?]> = [];

    await assert.rejects(
      deleteHabitEntryAndSyncReminders(42, {
        deleteHabitEntry: async (entryId: number) => {
          calls.push(['delete', entryId]);
          throw new Error('No se pudo deshacer el registro.');
        },
        syncLocalHabitReminders: async () => {
          calls.push(['sync']);
        },
      }),
      /No se pudo deshacer el registro\./
    );

    assert.deepEqual(calls, [['delete', 42]]);
  });
});

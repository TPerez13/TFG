import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import * as entriesApi from '../../src/features/habits/entriesApi';
import { useDeleteHabitEntry } from '../../src/features/habits/useDeleteHabitEntry';
import { renderHook } from '../helpers/renderHook';

afterEach(() => {
  mock.restoreAll();
});

describe('useDeleteHabitEntry', () => {
  it('deletes the entry and resets the deleting flag afterwards', async () => {
    let deletedId = -1;

    mock.method(entriesApi, 'deleteHabitEntry', async (entryId: number) => {
      deletedId = entryId;
    });

    const hook = await renderHook(() => useDeleteHabitEntry());

    assert.equal(hook.current.deleting, false);

    await hook.current.deleteEntry(42);
    await hook.flush();

    assert.equal(deletedId, 42);
    assert.equal(hook.current.deleting, false);
    await hook.unmount();
  });

  it('restores the deleting flag when deletion fails', async () => {
    mock.method(entriesApi, 'deleteHabitEntry', async () => {
      throw new Error('No se pudo deshacer el registro.');
    });

    const hook = await renderHook(() => useDeleteHabitEntry());

    await assert.rejects(hook.current.deleteEntry(42), /No se pudo deshacer el registro\./);
    await hook.flush();

    assert.equal(hook.current.deleting, false);
    await hook.unmount();
  });
});

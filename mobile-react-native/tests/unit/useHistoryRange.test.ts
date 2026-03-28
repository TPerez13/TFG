import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import * as entriesApi from '../../src/features/habits/entriesApi';
import { useHistoryRange } from '../../src/features/progress/useHistoryRange';
import { renderHook } from '../helpers/renderHook';

afterEach(() => {
  mock.restoreAll();
});

describe('useHistoryRange', () => {
  it('loads entries on mount and exposes a reload handler', async () => {
    let calls = 0;

    mock.method(entriesApi, 'fetchHabitEntries', async () => {
      calls += 1;
      return [
        {
          id_registro_habito: calls,
          id_usuario: 7,
          id_tipo_habito: 1,
          f_registro: '2026-03-02T08:00:00.000Z',
          valor: 250,
          unidad: 'ml',
          notas: null,
        },
      ];
    });

    const hook = await renderHook(() =>
      useHistoryRange('2026-03-01T00:00:00.000Z', '2026-03-07T23:59:59.999Z', 1)
    );

    await hook.flush();

    assert.equal(hook.current.loading, false);
    assert.equal(hook.current.error, null);
    assert.equal(hook.current.entries[0]?.id_registro_habito, 1);

    await hook.current.reload();
    await hook.flush();

    assert.equal(hook.current.entries[0]?.id_registro_habito, 2);
    await hook.unmount();
  });

  it('stores an error message and clears entries when loading fails', async () => {
    mock.method(entriesApi, 'fetchHabitEntries', async () => {
      throw new Error('No se pudo cargar el historial.');
    });

    const hook = await renderHook(() =>
      useHistoryRange('2026-03-01T00:00:00.000Z', '2026-03-07T23:59:59.999Z')
    );

    await hook.flush();

    assert.equal(hook.current.loading, false);
    assert.equal(hook.current.entries.length, 0);
    assert.equal(hook.current.error, 'No se pudo cargar el historial.');
    await hook.unmount();
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadHistoryRangeEntries } from '../../src/features/progress/historyRangeLoader';

describe('loadHistoryRangeEntries', () => {
  it('loads entries for the selected range', async () => {
    let calls = 0;
    let receivedRequest:
      | {
          from: string;
          to: string;
          typeId?: number;
        }
      | undefined;

    const firstLoad = await loadHistoryRangeEntries(
      {
        fromISO: '2026-03-01T00:00:00.000Z',
        toISO: '2026-03-07T23:59:59.999Z',
        typeId: 1,
      },
      {
        fetchHabitEntries: async (request) => {
          calls += 1;
          receivedRequest = request;
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
        },
      }
    );

    const secondLoad = await loadHistoryRangeEntries(
      {
        fromISO: '2026-03-01T00:00:00.000Z',
        toISO: '2026-03-07T23:59:59.999Z',
        typeId: 1,
      },
      {
        fetchHabitEntries: async () => {
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
        },
      }
    );

    assert.deepEqual(receivedRequest, {
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-07T23:59:59.999Z',
      typeId: 1,
    });
    assert.equal(firstLoad.error, null);
    assert.equal(firstLoad.entries[0]?.id_registro_habito, 1);
    assert.equal(secondLoad.entries[0]?.id_registro_habito, 2);
  });

  it('returns an empty list and the thrown message when loading fails', async () => {
    const result = await loadHistoryRangeEntries(
      {
        fromISO: '2026-03-01T00:00:00.000Z',
        toISO: '2026-03-07T23:59:59.999Z',
      },
      {
        fetchHabitEntries: async () => {
          throw new Error('No se pudo cargar el historial.');
        },
      }
    );

    assert.equal(result.entries.length, 0);
    assert.equal(result.error, 'No se pudo cargar el historial.');
  });
});

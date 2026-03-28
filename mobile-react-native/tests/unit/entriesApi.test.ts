import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import * as entriesApi from '../../src/features/habits/entriesApi';
import * as apiModule from '../../src/services/api';
import { jsonResponse } from '../helpers/http';

afterEach(() => {
  mock.restoreAll();
});

describe('habits/entriesApi', () => {
  it('normalizes day ranges and sorts fetched entries in ascending order', async () => {
    let requestedPath = '';
    const expectedFrom = encodeURIComponent(
      new Date(2026, 2, 2, 0, 0, 0, 0).toISOString()
    );
    const expectedTo = encodeURIComponent(
      new Date(2026, 2, 3, 23, 59, 59, 999).toISOString()
    );

    mock.method(apiModule, 'apiFetch', async (path: string) => {
      requestedPath = path;
      return jsonResponse({
        entries: [
          {
            id_registro_habito: 2,
            id_usuario: 7,
            id_tipo_habito: 1,
            f_registro: '2026-03-03T12:00:00.000Z',
            valor: 400,
            unidad: 'ml',
            notas: null,
          },
          {
            id_registro_habito: 1,
            id_usuario: 7,
            id_tipo_habito: 1,
            f_registro: '2026-03-02T08:00:00.000Z',
            valor: 250,
            unidad: 'ml',
            notas: null,
          },
        ],
      });
    });

    const result = await entriesApi.fetchHabitEntries({
      from: '2026-03-02',
      to: '2026-03-03',
      typeId: 1,
    });

    assert.equal(
      requestedPath,
      `/habits/entries?from=${expectedFrom}&to=${expectedTo}&typeId=1`
    );
    assert.deepEqual(
      result.map((item) => item.id_registro_habito),
      [1, 2]
    );
  });

  it('propagates backend messages when fetchHabitEntries fails', async () => {
    mock.method(apiModule, 'apiFetch', async () =>
      jsonResponse({ message: 'Token invalido.' }, { status: 401 })
    );

    await assert.rejects(
      entriesApi.fetchHabitEntries({
        from: '2026-03-02',
        to: '2026-03-03',
      }),
      /Token invalido\./
    );
  });

  it('returns the created entry and validates the response body', async () => {
    let requestInit: RequestInit | undefined;

    mock.method(apiModule, 'apiFetch', async (_path: string, init?: RequestInit) => {
      requestInit = init;
      return jsonResponse({
        entry: {
          id_registro_habito: 8,
          id_usuario: 7,
          id_tipo_habito: 3,
          f_registro: '2026-03-02T10:00:00.000Z',
          valor: 30,
          unidad: 'min',
          notas: null,
        },
      });
    });

    const created = await entriesApi.createHabitEntry({
      typeId: 3,
      value: 30,
      unit: 'min',
      notes: 'cinta',
    });

    assert.equal(requestInit?.method, 'POST');
    assert.deepEqual(created, {
      id_registro_habito: 8,
      id_usuario: 7,
      id_tipo_habito: 3,
      f_registro: '2026-03-02T10:00:00.000Z',
      valor: 30,
      unidad: 'min',
      notas: null,
    });
  });

  it('calls the delete endpoint for the selected entry', async () => {
    let requestedPath = '';
    let requestInit: RequestInit | undefined;

    mock.method(apiModule, 'apiFetch', async (path: string, init?: RequestInit) => {
      requestedPath = path;
      requestInit = init;
      return jsonResponse({ ok: true });
    });

    await entriesApi.deleteHabitEntry(42);

    assert.equal(requestedPath, '/habits/entries/42');
    assert.equal(requestInit?.method, 'DELETE');
  });
});

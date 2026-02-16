import type { HabitEntry } from '../../types/models';
import { apiFetch } from '../../services/api';

export type CreateHabitEntryPayload = {
  typeId: number;
  value: number;
  unit?: string;
  dateTime?: string;
  notes?: string;
};

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? fallback;
  } catch {
    return fallback;
  }
};

export async function fetchHabitEntries(params: {
  from: string;
  to: string;
  typeId?: number;
}): Promise<HabitEntry[]> {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
  });
  if (typeof params.typeId === 'number') {
    query.append('typeId', String(params.typeId));
  }

  const response = await apiFetch(`/habits/entries?${query.toString()}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'No se pudieron cargar los registros.'));
  }

  const payload = (await response.json()) as { entries?: HabitEntry[] };
  return payload.entries ?? [];
}

export async function createHabitEntry(payload: CreateHabitEntryPayload): Promise<HabitEntry> {
  const response = await apiFetch('/habits/entries', {
    method: 'POST',
    body: JSON.stringify({
      typeId: payload.typeId,
      value: payload.value,
      unit: payload.unit,
      dateTime: payload.dateTime,
      notes: payload.notes,
    }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'No se pudo guardar el registro.'));
  }

  const body = (await response.json()) as { entry?: HabitEntry };
  if (!body.entry) {
    throw new Error('Respuesta invalida al guardar el registro.');
  }
  return body.entry;
}

export async function deleteHabitEntry(entryId: number): Promise<void> {
  const response = await apiFetch(`/habits/entries/${entryId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'No se pudo deshacer el registro.'));
  }
}

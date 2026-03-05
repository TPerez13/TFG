import type { HabitEntry } from '../../types/models';
import { apiFetch } from '../../services/api';

export type CreateHabitEntryPayload = {
  typeId: number;
  value: number;
  unit?: string;
  dateTime?: string;
  notes?: string;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toDateOnly = (value: string) => {
  if (DATE_ONLY_PATTERN.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDayBoundaryIso = (dateOnly: string, boundary: 'from' | 'to') => {
  const [year, month, day] = dateOnly.split('-').map((item) => Number(item));
  if (!year || !month || !day) {
    return dateOnly;
  }

  const date =
    boundary === 'from'
      ? new Date(year, month - 1, day, 0, 0, 0, 0)
      : new Date(year, month - 1, day, 23, 59, 59, 999);

  return date.toISOString();
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
  const fromDateOnly = toDateOnly(params.from);
  const toDateOnlyValue = toDateOnly(params.to);
  const query = new URLSearchParams({
    from: toDayBoundaryIso(fromDateOnly, 'from'),
    to: toDayBoundaryIso(toDateOnlyValue, 'to'),
  });
  if (typeof params.typeId === 'number') {
    query.append('typeId', String(params.typeId));
  }

  const response = await apiFetch(`/habits/entries?${query.toString()}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'No se pudieron cargar los registros.'));
  }

  const payload = (await response.json()) as { entries?: HabitEntry[] };
  return [...(payload.entries ?? [])].sort(
    (left, right) => new Date(left.f_registro).getTime() - new Date(right.f_registro).getTime(),
  );
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

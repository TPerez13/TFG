import type { HabitEntry } from '../../types/models';
import { fetchHabitEntries as fetchHabitEntriesRequest } from '../habits/entriesApi';

const HISTORY_RANGE_ERROR = 'No se pudo cargar el historial.';

type HistoryRangeRequest = {
  fromISO: string;
  toISO: string;
  typeId?: number;
};

type HistoryRangeDependencies = {
  fetchHabitEntries?: typeof fetchHabitEntriesRequest;
};

export type HistoryRangeLoadResult = {
  entries: HabitEntry[];
  error: string | null;
};

const toErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export async function loadHistoryRangeEntries(
  request: HistoryRangeRequest,
  dependencies: HistoryRangeDependencies = {}
): Promise<HistoryRangeLoadResult> {
  const fetchEntries = dependencies.fetchHabitEntries ?? fetchHabitEntriesRequest;

  try {
    const entries = await fetchEntries({
      from: request.fromISO,
      to: request.toISO,
      typeId: request.typeId,
    });
    return { entries, error: null };
  } catch (error) {
    return {
      entries: [],
      error: toErrorMessage(error, HISTORY_RANGE_ERROR),
    };
  }
}

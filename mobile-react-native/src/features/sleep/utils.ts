import type { HabitEntry } from '../../types/models';
import type { SleepHistoryItem, SleepNotesPayload, SleepQuality, SleepTemplate } from './types';

const normalizeQuality = (value: unknown): SleepQuality | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'mala') return 'mala';
  if (normalized === 'regular') return 'regular';
  if (normalized === 'buena') return 'buena';
  return undefined;
};

const normalizeTime = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed;
};

export const serializeSleepNotes = (payload: SleepNotesPayload): string | null => {
  const jsonPayload: Record<string, unknown> = {};
  if (payload.quality) jsonPayload.quality = payload.quality;
  if (payload.start) jsonPayload.start = payload.start;
  if (payload.end) jsonPayload.end = payload.end;
  if (payload.notesText && payload.notesText.trim()) jsonPayload.notesText = payload.notesText.trim();
  return Object.keys(jsonPayload).length > 0 ? JSON.stringify(jsonPayload) : null;
};

export const parseSleepNotes = (notes: string | null) => {
  if (!notes || !notes.trim()) {
    return {
      quality: undefined,
      start: undefined,
      end: undefined,
      notesText: undefined,
    };
  }

  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    return {
      quality: normalizeQuality(parsed.quality),
      start: normalizeTime(parsed.start),
      end: normalizeTime(parsed.end),
      notesText: typeof parsed.notesText === 'string' ? parsed.notesText : undefined,
    };
  } catch {
    return {
      quality: undefined,
      start: undefined,
      end: undefined,
      notesText: notes,
    };
  }
};

export const hoursFromEntry = (entry: HabitEntry) => {
  const value = Number(entry.valor) || 0;
  if (!value) return 0;
  const unit = (entry.unidad ?? 'h').trim().toLowerCase();
  if (unit === 'min' || unit === 'mins' || unit === 'minuto' || unit === 'minutos') return value / 60;
  return value;
};

export const toSleepHistoryItem = (entry: HabitEntry): SleepHistoryItem => {
  const parsed = parseSleepNotes(entry.notas ?? null);
  return {
    id: entry.id_registro_habito,
    dateTime: entry.f_registro,
    hours: hoursFromEntry(entry),
    quality: parsed.quality,
    start: parsed.start,
    end: parsed.end,
    notesText: parsed.notesText,
    rawEntry: entry,
  };
};

export const buildSleepTemplateLabel = (template: { hours: number; quality?: SleepQuality }) =>
  `${template.hours.toFixed(2)}-${template.quality ?? 'none'}`;

export const toTemplateFromHistory = (item: SleepHistoryItem): SleepTemplate => ({
  hours: item.hours,
  quality: item.quality,
  start: item.start,
  end: item.end,
  notesText: item.notesText,
  label: buildSleepTemplateLabel(item),
});

export const formatHours = (hours: number) => {
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
};

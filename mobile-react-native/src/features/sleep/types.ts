import type { HabitEntry } from '../../types/models';

export const SLEEP_QUALITIES = ['mala', 'regular', 'buena'] as const;
export type SleepQuality = (typeof SLEEP_QUALITIES)[number];

export type SleepNotesPayload = {
  quality?: SleepQuality;
  start?: string;
  end?: string;
  notesText?: string;
};

export type SleepHistoryItem = {
  id: number;
  dateTime: string;
  hours: number;
  quality?: SleepQuality;
  start?: string;
  end?: string;
  notesText?: string;
  rawEntry: HabitEntry;
};

export type SleepTemplate = {
  hours: number;
  quality?: SleepQuality;
  start?: string;
  end?: string;
  notesText?: string;
  label: string;
};

export const sleepQualityLabel = (quality?: SleepQuality) => {
  if (!quality) return '';
  if (quality === 'mala') return 'Mala';
  if (quality === 'regular') return 'Regular';
  return 'Buena';
};

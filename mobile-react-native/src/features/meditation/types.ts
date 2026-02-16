import type { HabitEntry } from '../../types/models';

export const MEDITATION_TYPES = ['respiracion', 'mindfulness', 'guiada', 'escaneo', 'otro'] as const;
export type MeditationSessionType = (typeof MEDITATION_TYPES)[number];

export type MeditationNotesPayload = {
  type?: MeditationSessionType;
  moodBefore?: number;
  moodAfter?: number;
  notesText?: string;
};

export type MeditationHistoryItem = {
  id: number;
  dateTime: string;
  durationMin: number;
  type: MeditationSessionType;
  moodBefore?: number;
  moodAfter?: number;
  notesText?: string;
  rawEntry: HabitEntry;
};

export type MeditationTemplate = {
  type: MeditationSessionType;
  durationMin: number;
  moodBefore?: number;
  moodAfter?: number;
  notesText?: string;
  label: string;
};

export const meditationTypeLabel = (type: MeditationSessionType) => {
  switch (type) {
    case 'respiracion':
      return 'Respiracion';
    case 'mindfulness':
      return 'Mindfulness';
    case 'guiada':
      return 'Meditacion guiada';
    case 'escaneo':
      return 'Escaneo corporal';
    default:
      return 'Otro';
  }
};

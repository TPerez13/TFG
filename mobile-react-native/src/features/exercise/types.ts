import type { HabitEntry } from '../../types/models';

export const EXERCISE_ACTIVITY_TYPES = ['caminata', 'carrera', 'fuerza', 'otro'] as const;
export type ExerciseActivityType = (typeof EXERCISE_ACTIVITY_TYPES)[number];

export const EXERCISE_INTENSITIES = ['suave', 'media', 'alta'] as const;
export type ExerciseIntensity = (typeof EXERCISE_INTENSITIES)[number];

export type ExerciseNotesPayload = {
  activityType?: ExerciseActivityType;
  intensity?: ExerciseIntensity;
  kcal?: number;
  notesText?: string;
};

export type ExerciseHistoryItem = {
  id: number;
  dateTime: string;
  durationMin: number;
  activityType: ExerciseActivityType;
  intensity?: ExerciseIntensity;
  kcal?: number;
  notesText?: string;
  rawEntry: HabitEntry;
};

export type ExerciseTemplate = {
  activityType: ExerciseActivityType;
  durationMin: number;
  intensity?: ExerciseIntensity;
  kcal?: number;
  notesText?: string;
  label: string;
};

export const exerciseTypeLabel = (type: ExerciseActivityType) => {
  switch (type) {
    case 'caminata':
      return 'Caminata';
    case 'carrera':
      return 'Carrera';
    case 'fuerza':
      return 'Fuerza';
    default:
      return 'Otro';
  }
};

export const exerciseIntensityLabel = (value?: ExerciseIntensity) => {
  if (!value) return '';
  if (value === 'suave') return 'Suave';
  if (value === 'media') return 'Media';
  return 'Alta';
};

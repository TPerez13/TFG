import type { HabitEntry } from '../../types/models';
import type { ExerciseActivityType, ExerciseHistoryItem, ExerciseNotesPayload, ExerciseTemplate } from './types';

const toSafeNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeActivityType = (value: unknown): ExerciseActivityType => {
  if (typeof value !== 'string') return 'otro';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'caminata') return 'caminata';
  if (normalized === 'carrera') return 'carrera';
  if (normalized === 'fuerza') return 'fuerza';
  return 'otro';
};

const normalizeIntensity = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'suave') return 'suave';
  if (normalized === 'media') return 'media';
  if (normalized === 'alta') return 'alta';
  return undefined;
};

export const serializeExerciseNotes = (payload: ExerciseNotesPayload): string | null => {
  const jsonPayload: Record<string, unknown> = {};
  if (payload.activityType) jsonPayload.activityType = payload.activityType;
  if (payload.intensity) jsonPayload.intensity = payload.intensity;
  if (typeof payload.kcal === 'number' && Number.isFinite(payload.kcal)) jsonPayload.kcal = payload.kcal;
  if (payload.notesText && payload.notesText.trim()) jsonPayload.notesText = payload.notesText.trim();
  const hasKeys = Object.keys(jsonPayload).length > 0;
  return hasKeys ? JSON.stringify(jsonPayload) : null;
};

export const parseExerciseNotes = (notes: string | null) => {
  if (!notes || !notes.trim()) {
    return {
      activityType: 'otro' as ExerciseActivityType,
      intensity: undefined,
      kcal: undefined,
      notesText: undefined,
    };
  }

  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    return {
      activityType: normalizeActivityType(parsed.activityType),
      intensity: normalizeIntensity(parsed.intensity),
      kcal: toSafeNumber(parsed.kcal),
      notesText: typeof parsed.notesText === 'string' ? parsed.notesText : undefined,
    };
  } catch {
    return {
      activityType: 'otro' as ExerciseActivityType,
      intensity: undefined,
      kcal: undefined,
      notesText: notes,
    };
  }
};

export const durationToMinutes = (entry: HabitEntry) => {
  const value = Number(entry.valor) || 0;
  if (!value) return 0;
  const unit = (entry.unidad ?? 'min').trim().toLowerCase();
  if (unit === 'h' || unit === 'hr' || unit === 'hora' || unit === 'horas') return value * 60;
  return value;
};

export const toExerciseHistoryItem = (entry: HabitEntry): ExerciseHistoryItem => {
  const parsed = parseExerciseNotes(entry.notas ?? null);
  return {
    id: entry.id_registro_habito,
    dateTime: entry.f_registro,
    durationMin: durationToMinutes(entry),
    activityType: parsed.activityType,
    intensity: parsed.intensity,
    kcal: parsed.kcal,
    notesText: parsed.notesText,
    rawEntry: entry,
  };
};

export const buildTemplateLabel = (template: {
  activityType: ExerciseActivityType;
  durationMin: number;
}) => `${template.activityType}-${template.durationMin}`;

export const toTemplateFromHistory = (item: ExerciseHistoryItem): ExerciseTemplate => ({
  activityType: item.activityType,
  durationMin: item.durationMin,
  intensity: item.intensity,
  kcal: item.kcal,
  notesText: item.notesText,
  label: buildTemplateLabel({ activityType: item.activityType, durationMin: item.durationMin }),
});

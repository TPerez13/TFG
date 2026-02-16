import type { HabitEntry } from '../../types/models';
import type {
  MeditationHistoryItem,
  MeditationNotesPayload,
  MeditationSessionType,
  MeditationTemplate,
} from './types';

const clampMood = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  const rounded = Math.round(parsed);
  if (rounded < 1 || rounded > 5) return undefined;
  return rounded;
};

const normalizeType = (value: unknown): MeditationSessionType => {
  if (typeof value !== 'string') return 'otro';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'respiracion') return 'respiracion';
  if (normalized === 'mindfulness') return 'mindfulness';
  if (normalized === 'guiada') return 'guiada';
  if (normalized === 'escaneo') return 'escaneo';
  return 'otro';
};

export const serializeMeditationNotes = (payload: MeditationNotesPayload): string | null => {
  const jsonPayload: Record<string, unknown> = {};
  if (payload.type) jsonPayload.type = payload.type;
  if (typeof payload.moodBefore === 'number') jsonPayload.moodBefore = payload.moodBefore;
  if (typeof payload.moodAfter === 'number') jsonPayload.moodAfter = payload.moodAfter;
  if (payload.notesText && payload.notesText.trim()) jsonPayload.notesText = payload.notesText.trim();
  return Object.keys(jsonPayload).length > 0 ? JSON.stringify(jsonPayload) : null;
};

export const parseMeditationNotes = (notes: string | null) => {
  if (!notes || !notes.trim()) {
    return {
      type: 'otro' as MeditationSessionType,
      moodBefore: undefined,
      moodAfter: undefined,
      notesText: undefined,
    };
  }

  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    return {
      type: normalizeType(parsed.type),
      moodBefore: clampMood(parsed.moodBefore),
      moodAfter: clampMood(parsed.moodAfter),
      notesText: typeof parsed.notesText === 'string' ? parsed.notesText : undefined,
    };
  } catch {
    return {
      type: 'otro' as MeditationSessionType,
      moodBefore: undefined,
      moodAfter: undefined,
      notesText: notes,
    };
  }
};

export const durationToMinutes = (entry: HabitEntry) => {
  const value = Number(entry.valor) || 0;
  if (!value) return 0;
  const unit = (entry.unidad ?? 'min').trim().toLowerCase();
  if (unit === 'h' || unit === 'hora' || unit === 'horas') return value * 60;
  return value;
};

export const toMeditationHistoryItem = (entry: HabitEntry): MeditationHistoryItem => {
  const parsed = parseMeditationNotes(entry.notas ?? null);
  return {
    id: entry.id_registro_habito,
    dateTime: entry.f_registro,
    durationMin: durationToMinutes(entry),
    type: parsed.type,
    moodBefore: parsed.moodBefore,
    moodAfter: parsed.moodAfter,
    notesText: parsed.notesText,
    rawEntry: entry,
  };
};

export const buildMeditationTemplateLabel = (template: {
  type: MeditationSessionType;
  durationMin: number;
  moodBefore?: number;
  moodAfter?: number;
}) => `${template.type}-${template.durationMin}-${template.moodBefore ?? 0}-${template.moodAfter ?? 0}`;

export const toTemplateFromHistory = (item: MeditationHistoryItem): MeditationTemplate => ({
  type: item.type,
  durationMin: item.durationMin,
  moodBefore: item.moodBefore,
  moodAfter: item.moodAfter,
  notesText: item.notesText,
  label: buildMeditationTemplateLabel(item),
});

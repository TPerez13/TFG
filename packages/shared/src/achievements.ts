export type AchievementId =
  | "FIRST_ENTRY"
  | "FIRST_WATER_ENTRY"
  | "FIRST_NUTRITION_ENTRY"
  | "FIRST_EXERCISE_ENTRY"
  | "FIRST_SLEEP_ENTRY"
  | "FIRST_MEDITATION_ENTRY"
  | "STREAK_3"
  | "STREAK_7"
  | "STREAK_14"
  | "STREAK_30"
  | "PERFECT_DAY"
  | "PERFECT_DAY_3"
  | "PERFECT_DAY_7"
  | "WEEK_60"
  | "WEEK_80"
  | "WEEK_100"
  | "MONTH_50"
  | "MONTH_70"
  | "MONTH_90"
  | "TOTAL_ENTRIES_10"
  | "TOTAL_ENTRIES_50"
  | "TOTAL_ENTRIES_100"
  | "HABIT_MASTER_15"
  | "HABIT_MASTER"
  | "HABIT_MASTER_60"
  | "WATER_7"
  | "NUTRITION_7"
  | "EXERCISE_7"
  | "SLEEP_7"
  | "MEDITATION_7";

export type AchievementCriteria =
  | { type: "first_entry"; target: 1 }
  | { type: "first_habit_entry"; habitTypeId: number; target: 1 }
  | { type: "total_entries"; target: number }
  | { type: "streak"; target: number }
  | { type: "perfect_day"; target: number }
  | { type: "week_completion"; targetPct: number; windowDays: number }
  | { type: "month_completion"; targetPct: number }
  | { type: "habit_master"; target: number }
  | { type: "habit_completion"; habitTypeId: number; target: number };

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  points: number;
  difficulty: number;
  sharePriority: number;
  shareTitle: string;
  shareMessage: string;
  criteria: AchievementCriteria;
};

export type AchievementProgress = {
  current: number;
  target: number;
};

export type AchievementItem = {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  points: number;
  difficulty: number;
  sharePriority: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: AchievementProgress;
};

export type AchievementListResponse = {
  achievements: AchievementItem[];
};

const createAchievement = (
  definition: AchievementDefinition
): AchievementDefinition => definition;

const createStreakAchievement = (
  id: AchievementId,
  target: number,
  options: {
    title: string;
    description: string;
    icon: string;
    points: number;
    difficulty: number;
    sharePriority: number;
    shareMessage: string;
  }
): AchievementDefinition =>
  createAchievement({
    id,
    title: options.title,
    description: options.description,
    icon: options.icon,
    points: options.points,
    difficulty: options.difficulty,
    sharePriority: options.sharePriority,
    shareTitle: `He conseguido ${options.title.toLowerCase()}`,
    shareMessage: options.shareMessage,
    criteria: { type: "streak", target },
  });

const createPerfectDayAchievement = (
  id: AchievementId,
  target: number,
  options: {
    title: string;
    description: string;
    icon: string;
    points: number;
    difficulty: number;
    sharePriority: number;
    shareMessage: string;
  }
): AchievementDefinition =>
  createAchievement({
    id,
    title: options.title,
    description: options.description,
    icon: options.icon,
    points: options.points,
    difficulty: options.difficulty,
    sharePriority: options.sharePriority,
    shareTitle: `He desbloqueado ${options.title}`,
    shareMessage: options.shareMessage,
    criteria: { type: "perfect_day", target },
  });

const createWeekCompletionAchievement = (
  id: AchievementId,
  targetPct: number,
  options: {
    title: string;
    description: string;
    points: number;
    difficulty: number;
    sharePriority: number;
    shareMessage: string;
  }
): AchievementDefinition =>
  createAchievement({
    id,
    title: options.title,
    description: options.description,
    icon: "calendar-outline",
    points: options.points,
    difficulty: options.difficulty,
    sharePriority: options.sharePriority,
    shareTitle: `He desbloqueado ${options.title}`,
    shareMessage: options.shareMessage,
    criteria: { type: "week_completion", targetPct, windowDays: 7 },
  });

const createMonthCompletionAchievement = (
  id: AchievementId,
  targetPct: number,
  options: {
    title: string;
    description: string;
    points: number;
    difficulty: number;
    sharePriority: number;
    shareMessage: string;
  }
): AchievementDefinition =>
  createAchievement({
    id,
    title: options.title,
    description: options.description,
    icon: "trophy-outline",
    points: options.points,
    difficulty: options.difficulty,
    sharePriority: options.sharePriority,
    shareTitle: `He desbloqueado ${options.title}`,
    shareMessage: options.shareMessage,
    criteria: { type: "month_completion", targetPct },
  });

const createTotalEntriesAchievement = (
  id: AchievementId,
  target: number,
  options: {
    title: string;
    description: string;
    points: number;
    difficulty: number;
    sharePriority: number;
    shareMessage: string;
  }
): AchievementDefinition =>
  createAchievement({
    id,
    title: options.title,
    description: options.description,
    icon: "albums-outline",
    points: options.points,
    difficulty: options.difficulty,
    sharePriority: options.sharePriority,
    shareTitle: `He llegado a ${target} registros`,
    shareMessage: options.shareMessage,
    criteria: { type: "total_entries", target },
  });

const createHabitMasterAchievement = (
  id: AchievementId,
  target: number,
  options: {
    title: string;
    description: string;
    points: number;
    difficulty: number;
    sharePriority: number;
    shareMessage: string;
  }
): AchievementDefinition =>
  createAchievement({
    id,
    title: options.title,
    description: options.description,
    icon: "medal-outline",
    points: options.points,
    difficulty: options.difficulty,
    sharePriority: options.sharePriority,
    shareTitle: `He desbloqueado ${options.title}`,
    shareMessage: options.shareMessage,
    criteria: { type: "habit_master", target },
  });

const createFirstHabitEntryAchievement = (
  id: AchievementId,
  habitTypeId: number,
  options: {
    title: string;
    description: string;
    icon: string;
    points: number;
    difficulty: number;
    sharePriority: number;
    shareMessage: string;
  }
): AchievementDefinition =>
  createAchievement({
    id,
    title: options.title,
    description: options.description,
    icon: options.icon,
    points: options.points,
    difficulty: options.difficulty,
    sharePriority: options.sharePriority,
    shareTitle: `He conseguido ${options.title.toLowerCase()}`,
    shareMessage: options.shareMessage,
    criteria: { type: "first_habit_entry", habitTypeId, target: 1 },
  });

const createHabitCompletionAchievement = (
  id: AchievementId,
  habitTypeId: number,
  target: number,
  options: {
    title: string;
    description: string;
    icon: string;
    points: number;
    difficulty: number;
    sharePriority: number;
    shareMessage: string;
  }
): AchievementDefinition =>
  createAchievement({
    id,
    title: options.title,
    description: options.description,
    icon: options.icon,
    points: options.points,
    difficulty: options.difficulty,
    sharePriority: options.sharePriority,
    shareTitle: `He desbloqueado ${options.title}`,
    shareMessage: options.shareMessage,
    criteria: { type: "habit_completion", habitTypeId, target },
  });

const ACHIEVEMENT_DEFINITIONS_INTERNAL: readonly AchievementDefinition[] = [
  createAchievement({
    id: "FIRST_ENTRY",
    title: "Primer registro",
    description: "Registra tu primer avance en cualquier habito.",
    icon: "sparkles-outline",
    points: 10,
    difficulty: 10,
    sharePriority: 10,
    shareTitle: "He desbloqueado mi primer logro",
    shareMessage: "He empezado mi progreso saludable con mi primer registro.",
    criteria: { type: "first_entry", target: 1 },
  }),
  createFirstHabitEntryAchievement("FIRST_WATER_ENTRY", 1, {
    title: "Primera gota",
    description: "Haz tu primer registro de hidratacion.",
    icon: "water-outline",
    points: 10,
    difficulty: 12,
    sharePriority: 12,
    shareMessage: "He registrado mi primer avance de hidratacion.",
  }),
  createFirstHabitEntryAchievement("FIRST_NUTRITION_ENTRY", 2, {
    title: "Primer plato",
    description: "Haz tu primer registro de nutricion.",
    icon: "restaurant-outline",
    points: 10,
    difficulty: 12,
    sharePriority: 12,
    shareMessage: "He registrado mi primera comida dentro de la app.",
  }),
  createFirstHabitEntryAchievement("FIRST_EXERCISE_ENTRY", 3, {
    title: "Primera sesion",
    description: "Haz tu primer registro de ejercicio.",
    icon: "barbell-outline",
    points: 10,
    difficulty: 15,
    sharePriority: 14,
    shareMessage: "He registrado mi primera sesion de ejercicio.",
  }),
  createFirstHabitEntryAchievement("FIRST_SLEEP_ENTRY", 4, {
    title: "Primera noche",
    description: "Haz tu primer registro de sueno.",
    icon: "moon-outline",
    points: 10,
    difficulty: 12,
    sharePriority: 12,
    shareMessage: "He registrado mi primer avance de descanso.",
  }),
  createFirstHabitEntryAchievement("FIRST_MEDITATION_ENTRY", 5, {
    title: "Primer respiro",
    description: "Haz tu primer registro de meditacion.",
    icon: "leaf-outline",
    points: 10,
    difficulty: 12,
    sharePriority: 12,
    shareMessage: "He registrado mi primer momento de meditacion.",
  }),
  createStreakAchievement("STREAK_3", 3, {
    title: "Racha de 3 dias",
    description: "Registra actividad durante 3 dias consecutivos.",
    icon: "flame-outline",
    points: 25,
    difficulty: 25,
    sharePriority: 20,
    shareMessage: "He mantenido el ritmo durante 3 dias seguidos.",
  }),
  createStreakAchievement("STREAK_7", 7, {
    title: "Racha de 7 dias",
    description: "Mantiene una racha de una semana completa.",
    icon: "flame",
    points: 50,
    difficulty: 55,
    sharePriority: 50,
    shareMessage: "He completado una semana seguida manteniendo mis habitos.",
  }),
  createStreakAchievement("STREAK_14", 14, {
    title: "Racha de 14 dias",
    description: "Mantiene dos semanas seguidas de actividad.",
    icon: "flame",
    points: 75,
    difficulty: 70,
    sharePriority: 65,
    shareMessage: "He sostenido mis habitos durante 14 dias consecutivos.",
  }),
  createStreakAchievement("STREAK_30", 30, {
    title: "Racha de 30 dias",
    description: "Mantiene un mes entero de actividad continua.",
    icon: "flame",
    points: 140,
    difficulty: 95,
    sharePriority: 95,
    shareMessage: "He completado 30 dias seguidos cuidando mis habitos.",
  }),
  createPerfectDayAchievement("PERFECT_DAY", 1, {
    title: "Dia perfecto",
    description: "Cumple todos tus habitos objetivo en un mismo dia.",
    icon: "star-outline",
    points: 40,
    difficulty: 40,
    sharePriority: 30,
    shareMessage: "He cumplido todos mis habitos objetivo en un mismo dia.",
  }),
  createPerfectDayAchievement("PERFECT_DAY_3", 3, {
    title: "Triplete perfecto",
    description: "Consigue 3 dias perfectos.",
    icon: "star-half-outline",
    points: 70,
    difficulty: 65,
    sharePriority: 55,
    shareMessage: "Ya he conseguido 3 dias perfectos siguiendo todos mis habitos.",
  }),
  createPerfectDayAchievement("PERFECT_DAY_7", 7, {
    title: "Semana perfecta",
    description: "Consigue 7 dias perfectos.",
    icon: "star",
    points: 120,
    difficulty: 90,
    sharePriority: 90,
    shareMessage: "He sumado 7 dias perfectos cumpliendo todos mis objetivos.",
  }),
  createWeekCompletionAchievement("WEEK_60", 60, {
    title: "Semana en marcha",
    description: "Alcanza un 60 % de cumplimiento en una ventana de 7 dias.",
    points: 35,
    difficulty: 35,
    sharePriority: 28,
    shareMessage: "He alcanzado un 60 % de cumplimiento semanal.",
  }),
  createWeekCompletionAchievement("WEEK_80", 80, {
    title: "Semana constante",
    description: "Consigue al menos un 80 % de cumplimiento en una ventana de 7 dias.",
    points: 65,
    difficulty: 65,
    sharePriority: 60,
    shareMessage: "He alcanzado al menos un 80 % de cumplimiento en una semana.",
  }),
  createWeekCompletionAchievement("WEEK_100", 100, {
    title: "Semana impecable",
    description: "Completa una semana con un 100 % de cumplimiento.",
    points: 110,
    difficulty: 92,
    sharePriority: 88,
    shareMessage: "He completado una semana impecable sin fallar ningun objetivo.",
  }),
  createMonthCompletionAchievement("MONTH_50", 50, {
    title: "Mes en progreso",
    description: "Cierra un mes con al menos un 50 % de cumplimiento promedio.",
    points: 55,
    difficulty: 50,
    sharePriority: 45,
    shareMessage: "He cerrado el mes con un buen nivel de consistencia.",
  }),
  createMonthCompletionAchievement("MONTH_70", 70, {
    title: "Mes consistente",
    description: "Alcanza un 70 % de cumplimiento promedio en un mes.",
    points: 80,
    difficulty: 80,
    sharePriority: 80,
    shareMessage: "He cerrado el mes con al menos un 70 % de cumplimiento promedio.",
  }),
  createMonthCompletionAchievement("MONTH_90", 90, {
    title: "Mes sobresaliente",
    description: "Alcanza un 90 % de cumplimiento promedio en un mes.",
    points: 140,
    difficulty: 98,
    sharePriority: 98,
    shareMessage: "He cerrado un mes sobresaliente rozando la perfeccion.",
  }),
  createTotalEntriesAchievement("TOTAL_ENTRIES_10", 10, {
    title: "10 registros",
    description: "Acumula 10 registros en total.",
    points: 20,
    difficulty: 18,
    sharePriority: 16,
    shareMessage: "Ya he acumulado 10 registros de progreso.",
  }),
  createTotalEntriesAchievement("TOTAL_ENTRIES_50", 50, {
    title: "50 registros",
    description: "Acumula 50 registros en total.",
    points: 65,
    difficulty: 60,
    sharePriority: 52,
    shareMessage: "He alcanzado los 50 registros en mi historial.",
  }),
  createTotalEntriesAchievement("TOTAL_ENTRIES_100", 100, {
    title: "100 registros",
    description: "Acumula 100 registros en total.",
    points: 120,
    difficulty: 88,
    sharePriority: 84,
    shareMessage: "He superado los 100 registros dentro de la app.",
  }),
  createHabitMasterAchievement("HABIT_MASTER_15", 15, {
    title: "Rutina en marcha",
    description: "Cumple un mismo habito 15 veces.",
    points: 55,
    difficulty: 55,
    sharePriority: 48,
    shareMessage: "He repetido el mismo habito 15 veces y ya es parte de mi rutina.",
  }),
  createHabitMasterAchievement("HABIT_MASTER", 30, {
    title: "Maestro del habito",
    description: "Cumple un mismo habito 30 veces.",
    points: 100,
    difficulty: 100,
    sharePriority: 100,
    shareMessage: "He cumplido el mismo habito 30 veces y lo he convertido en rutina.",
  }),
  createHabitMasterAchievement("HABIT_MASTER_60", 60, {
    title: "Leyenda del habito",
    description: "Cumple un mismo habito 60 veces.",
    points: 180,
    difficulty: 100,
    sharePriority: 110,
    shareMessage: "He llevado un mismo habito tan lejos que ya forma parte de mi identidad.",
  }),
  createHabitCompletionAchievement("WATER_7", 1, 7, {
    title: "Hidratacion constante",
    description: "Cumple tu objetivo de agua en 7 dias.",
    icon: "water",
    points: 45,
    difficulty: 45,
    sharePriority: 36,
    shareMessage: "He cumplido mi meta de hidratacion durante 7 dias.",
  }),
  createHabitCompletionAchievement("NUTRITION_7", 2, 7, {
    title: "Nutricion constante",
    description: "Cumple tu objetivo de comidas en 7 dias.",
    icon: "restaurant",
    points: 45,
    difficulty: 45,
    sharePriority: 36,
    shareMessage: "He cumplido mi meta de nutricion durante 7 dias.",
  }),
  createHabitCompletionAchievement("EXERCISE_7", 3, 7, {
    title: "Movimiento constante",
    description: "Cumple tu objetivo de ejercicio en 7 dias.",
    icon: "walk",
    points: 60,
    difficulty: 58,
    sharePriority: 46,
    shareMessage: "He cumplido mi meta de ejercicio durante 7 dias.",
  }),
  createHabitCompletionAchievement("SLEEP_7", 4, 7, {
    title: "Descanso constante",
    description: "Cumple tu objetivo de sueno en 7 dias.",
    icon: "moon",
    points: 55,
    difficulty: 52,
    sharePriority: 42,
    shareMessage: "He cumplido mi meta de descanso durante 7 dias.",
  }),
  createHabitCompletionAchievement("MEDITATION_7", 5, 7, {
    title: "Calma constante",
    description: "Cumple tu objetivo de meditacion en 7 dias.",
    icon: "leaf",
    points: 55,
    difficulty: 52,
    sharePriority: 42,
    shareMessage: "He cumplido mi meta de meditacion durante 7 dias.",
  }),
] as const;

export const ACHIEVEMENT_DEFINITIONS = [...ACHIEVEMENT_DEFINITIONS_INTERNAL];

const ACHIEVEMENT_DEFINITION_MAP = new Map<AchievementId, AchievementDefinition>(
  ACHIEVEMENT_DEFINITIONS.map((definition) => [definition.id, definition])
);

const formatAchievementDate = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
};

const isSameMonth = (value: string | null, month: Date): boolean => {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return (
    parsed.getFullYear() === month.getFullYear() &&
    parsed.getMonth() === month.getMonth()
  );
};

export const getAchievementDefinition = (
  achievementId: AchievementId
): AchievementDefinition => {
  const definition = ACHIEVEMENT_DEFINITION_MAP.get(achievementId);

  if (!definition) {
    throw new Error(`Unknown achievement id: ${achievementId}`);
  }

  return definition;
};

export const compareAchievementsBySharePriority = (
  left: Pick<AchievementItem, "difficulty" | "sharePriority" | "title" | "unlockedAt">,
  right: Pick<AchievementItem, "difficulty" | "sharePriority" | "title" | "unlockedAt">
): number => {
  if (right.sharePriority !== left.sharePriority) {
    return right.sharePriority - left.sharePriority;
  }

  if (right.difficulty !== left.difficulty) {
    return right.difficulty - left.difficulty;
  }

  const leftTime = left.unlockedAt ? new Date(left.unlockedAt).getTime() : 0;
  const rightTime = right.unlockedAt ? new Date(right.unlockedAt).getTime() : 0;
  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }

  return left.title.localeCompare(right.title, "es-ES");
};

export const selectTopUnlockedAchievement = (
  achievements: AchievementItem[],
  month?: Date
): AchievementItem | null => {
  const filtered = achievements.filter(
    (achievement) =>
      achievement.unlocked &&
      achievement.unlockedAt &&
      (!month || isSameMonth(achievement.unlockedAt, month))
  );

  if (!filtered.length) {
    return null;
  }

  return [...filtered].sort(compareAchievementsBySharePriority)[0] ?? null;
};

export const buildAchievementShareContent = (
  achievement: AchievementItem,
  options?: {
    monthLabel?: string;
    contextTitle?: string;
  }
): { title: string; message: string } => {
  const definition = getAchievementDefinition(achievement.id);
  const achievedOn = formatAchievementDate(achievement.unlockedAt);
  const title = options?.contextTitle ?? definition.shareTitle;
  const intro = options?.monthLabel
    ? `Logro destacado de ${options.monthLabel}`
    : definition.shareTitle;

  const parts = [
    intro,
    definition.shareMessage,
    `Logro: ${achievement.title}.`,
    achievedOn ? `Desbloqueado el ${achievedOn}.` : null,
    `Dificultad: ${achievement.difficulty}/100.`,
    `Puntos: ${achievement.points}.`,
  ].filter((part): part is string => Boolean(part));

  return {
    title,
    message: parts.join("\n"),
  };
};

import type { HabitReminderSnapshot } from '../notifications/types';

export const MEAL_TYPES = ['DESAYUNO', 'ALMUERZO', 'CENA', 'SNACK'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export type NutritionEntry = {
  idRegistroComida: number;
  idUsuario: number;
  fRegistro: string;
  tipoComida: MealType;
  alimentoId: number | null;
  nombre: string;
  kcal: number;
  proteinaG: number | null;
  carbohidratosG: number | null;
  grasasG: number | null;
};

export type NutritionSummary = {
  kcal: number;
  proteinaG: number;
  carbohidratosG: number;
  grasasG: number;
};

export type NutritionTodayData = {
  date: string;
  objetivoDiario: number;
  comidasRegistradas: number;
  progreso: number;
  resumen: NutritionSummary;
  historial: NutritionEntry[];
  globalNotificationsEnabled: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderSnapshot: HabitReminderSnapshot;
};

export type FoodTemplate = {
  alimentoId: number | null;
  nombre: string;
  kcal: number;
  proteinaG: number | null;
  carbohidratosG: number | null;
  grasasG: number | null;
  veces?: number;
};

export type CreateNutritionEntryPayload = {
  tipoComida: MealType;
  nombre?: string;
  kcal?: number;
  proteinaG?: number;
  carbohidratosG?: number;
  grasasG?: number;
  alimentoId?: number | null;
  fRegistro?: string;
};

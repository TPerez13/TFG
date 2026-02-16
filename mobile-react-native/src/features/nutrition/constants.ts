import type { MealType } from './types';

export const mealTypeOptions: Array<{ key: MealType; label: string; icon: string }> = [
  { key: 'DESAYUNO', label: 'Desayuno', icon: 'partly-sunny-outline' },
  { key: 'ALMUERZO', label: 'Almuerzo', icon: 'sunny-outline' },
  { key: 'CENA', label: 'Cena', icon: 'moon-outline' },
  { key: 'SNACK', label: 'Snack', icon: 'cafe-outline' },
];

export const mealTypeLabel = (value: MealType) =>
  mealTypeOptions.find((item) => item.key === value)?.label ?? value;

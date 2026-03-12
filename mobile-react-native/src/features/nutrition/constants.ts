import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { MealType } from './types';

type MealTypeOption = {
  key: MealType;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export const mealTypeOptions: MealTypeOption[] = [
  { key: 'DESAYUNO', label: 'Desayuno', icon: 'partly-sunny-outline' },
  { key: 'ALMUERZO', label: 'Almuerzo', icon: 'sunny-outline' },
  { key: 'CENA', label: 'Cena', icon: 'moon-outline' },
  { key: 'SNACK', label: 'Snack', icon: 'cafe-outline' },
];

export const mealTypeLabel = (value: MealType) =>
  mealTypeOptions.find((item) => item.key === value)?.label ?? value;

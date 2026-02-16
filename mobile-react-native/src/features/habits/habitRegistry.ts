import { colors } from '../../theme/tokens';

export type HabitKey = 'agua' | 'ejercicio' | 'sueno' | 'comidas' | 'meditacion';

export type HabitGoal = {
  value: number;
  unit: string;
};

export type HabitQuickAdd = {
  enabled: boolean;
  value: number;
  unit: string;
};

export type HabitDefinition = {
  key: HabitKey;
  idTipoHabito: number;
  label: string;
  title: string;
  icon: string;
  goal: HabitGoal;
  quickAdd: HabitQuickAdd;
  accentColor: string;
  softColor: string;
  action?: {
    label: string;
    intent: 'navigate' | 'quick';
    routeName?: string;
  };
  formatSummary?: (current: number, goal: HabitGoal) => string;
  helperText?: string;
  visible?: boolean;
  showInGoals?: boolean;
};

export const habitRegistry: HabitDefinition[] = [
  {
    key: 'agua',
    idTipoHabito: 1,
    label: 'AGUA',
    title: 'Agua',
    icon: 'water-outline',
    goal: { value: 8, unit: 'vasos' },
    quickAdd: { enabled: true, value: 1, unit: 'vaso' },
    accentColor: '#2d7ff9',
    softColor: '#eaf3ff',
    action: { label: 'Anadir vaso +', intent: 'quick', routeName: 'HabitosTab' },
    formatSummary: (current, goal) => `${current} de ${goal.value} ${goal.unit}`,
    showInGoals: true,
  },
  {
    key: 'ejercicio',
    idTipoHabito: 3,
    label: 'EJERCICIO',
    title: 'Ejercicio',
    icon: 'barbell-outline',
    goal: { value: 45, unit: 'min' },
    quickAdd: { enabled: true, value: 10, unit: 'min' },
    accentColor: '#f07f2f',
    softColor: '#fff1e6',
    action: { label: 'Comenzar', intent: 'navigate', routeName: 'HabitosTab' },
    formatSummary: (current, goal) =>
      current > 0 ? `${current} de ${goal.value} ${goal.unit}` : `Meta: ${goal.value} ${goal.unit}`,
    showInGoals: true,
  },
  {
    key: 'comidas',
    idTipoHabito: 2,
    label: 'COMIDAS',
    title: 'Comidas / Nutricion',
    icon: 'restaurant-outline',
    goal: { value: 4, unit: 'platos' },
    quickAdd: { enabled: true, value: 1, unit: 'plato' },
    accentColor: colors.textAccent,
    softColor: colors.glowTop,
    formatSummary: (current, goal) =>
      current > 0 ? `${current} de ${goal.value} ${goal.unit}` : 'Frutas y verduras',
    showInGoals: true,
  },
  {
    key: 'sueno',
    idTipoHabito: 4,
    label: 'SUENO',
    title: 'Sueno',
    icon: 'moon-outline',
    goal: { value: 8, unit: 'horas' },
    quickAdd: { enabled: true, value: 1, unit: 'hora' },
    accentColor: '#6b78f0',
    softColor: '#eef0ff',
    formatSummary: (current, goal) =>
      current > 0 ? `${current} de ${goal.value} ${goal.unit}` : 'Calidad buena',
    showInGoals: true,
  },
  {
    key: 'meditacion',
    idTipoHabito: 5,
    label: 'MEDITACION',
    title: 'Meditacion',
    icon: 'leaf-outline',
    goal: { value: 10, unit: 'min' },
    quickAdd: { enabled: true, value: 5, unit: 'min' },
    accentColor: '#17a88a',
    softColor: '#e6f7f2',
    formatSummary: (current, goal) =>
      current > 0 ? `${current} de ${goal.value} ${goal.unit}` : 'Bienestar mental',
    showInGoals: true,
  },
];

export const getHabitByKey = (key: HabitKey) => habitRegistry.find((habit) => habit.key === key);

export const getHabitByTypeId = (typeId: number) =>
  habitRegistry.find((habit) => habit.idTipoHabito === typeId);

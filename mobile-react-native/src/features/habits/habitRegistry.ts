import { colors } from '../../theme/tokens';

export type HabitDefinition = {
  id: string;
  idTipoHabito: number;
  label: string;
  title: string;
  target: number;
  unit: string;
  accentColor: string;
  softColor: string;
  action?: {
    label: string;
    intent: 'navigate' | 'quick';
    routeName?: string;
  };
  formatSummary?: (current: number, target: number) => string;
  helperText?: string;
  visible?: boolean;
};

export const habitRegistry: HabitDefinition[] = [
  {
    id: 'agua',
    idTipoHabito: 1,
    label: 'AGUA',
    title: 'Consumo de agua',
    target: 8,
    unit: 'vasos',
    accentColor: '#2d7ff9',
    softColor: '#eaf3ff',
    action: { label: 'Anadir vaso +', intent: 'quick', routeName: 'HabitosTab' },
    formatSummary: (current, target) => `${current} de ${target} vasos`,
  },
  {
    id: 'ejercicio',
    idTipoHabito: 3,
    label: 'EJERCICIO',
    title: 'Caminata diaria',
    target: 30,
    unit: 'min',
    accentColor: '#f07f2f',
    softColor: '#fff1e6',
    action: { label: 'Comenzar', intent: 'navigate', routeName: 'HabitosTab' },
    formatSummary: (current, target) =>
      current > 0 ? `${current} de ${target} min` : `Meta: ${target} minutos`,
  },
  {
    id: 'nutricion',
    idTipoHabito: 2,
    label: 'NUTRICION',
    title: 'Saludable',
    target: 3,
    unit: 'porciones',
    accentColor: colors.textAccent,
    softColor: colors.glowTop,
    formatSummary: (current, target) =>
      current > 0 ? `${current} de ${target} porciones` : 'Frutas y verduras',
  },
  {
    id: 'sueno',
    idTipoHabito: 4,
    label: 'SUENO',
    title: 'Horas de descanso',
    target: 8,
    unit: 'horas',
    accentColor: '#6b78f0',
    softColor: '#eef0ff',
    formatSummary: (current, target) =>
      current > 0 ? `${current} de ${target} horas` : 'Calidad buena',
  },
  {
    id: 'meditacion',
    idTipoHabito: 5,
    label: 'MEDITACION',
    title: 'Respiracion guiada',
    target: 10,
    unit: 'min',
    accentColor: '#17a88a',
    softColor: '#e6f7f2',
    formatSummary: (current, target) =>
      current > 0 ? `${current} de ${target} min` : 'Bienestar mental',
  },
];

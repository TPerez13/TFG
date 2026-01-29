import type { User } from '../types/models';

export type AuthStackParamList = {
  Login: undefined;
  Register?: undefined;
};

export type HomeStackParamList = {
  PanelDiario: undefined;
};

export type HabitsStackParamList = {
  Habits: undefined;
};

export type ProgressStackParamList = {
  Progress: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Feed?: { user?: User } | undefined;
};

export type AppTabParamList = {
  InicioTab: undefined;
  HabitosTab: undefined;
  ProgresoTab: undefined;
  PerfilTab: undefined;
};

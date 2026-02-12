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
  NotificationDetail: { notificationId: number };
  NotificationSettings: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  AboutApp: undefined;
  PrivacyPolicy: undefined;
  TermsOfUse: undefined;
};

export type AppTabParamList = {
  InicioTab: undefined;
  HabitosTab: undefined;
  ProgresoTab: undefined;
  PerfilTab: undefined;
};

import type { User } from '../types/models';
import type { HabitKey } from '../features/habits/habitRegistry';
import type { MealType } from '../features/nutrition/types';
import type { ExerciseActivityType } from '../features/exercise/types';
import type { MeditationSessionType } from '../features/meditation/types';

export type AuthStackParamList = {
  Login: undefined;
  Register?: undefined;
};

export type HomeStackParamList = {
  PanelDiario: undefined;
};

export type HabitsStackParamList = {
  Habits: undefined;
  HabitDetail:
    | {
        habitKey?: HabitKey;
        typeId?: number;
        initialTab?: 'add';
        mode?: 'add';
      }
    | undefined;
  HabitGoals: undefined;
  Nutrition:
    | {
        tipoComidaSeleccionada?: MealType;
        refreshToken?: number;
      }
    | undefined;
  NutritionQuickAdd:
    | {
        tipoComidaSeleccionada?: MealType;
      }
    | undefined;
  NutritionManualEntry:
    | {
        tipoComidaSeleccionada?: MealType;
      }
    | undefined;
  Hidratacion:
    | {
        refreshToken?: number;
      }
    | undefined;
  RegistrarAgua:
    | {
        mode?: 'quick' | 'manual';
      }
    | undefined;
  Ejercicio:
    | {
        refreshToken?: number;
        activityTypeSeleccionada?: ExerciseActivityType;
      }
    | undefined;
  RegistrarEjercicio:
    | {
        mode?: 'quick' | 'manual';
        activityTypeSeleccionada?: ExerciseActivityType;
      }
    | undefined;
  Sueno:
    | {
        refreshToken?: number;
      }
    | undefined;
  RegistrarSueno:
    | {
        mode?: 'quick' | 'manual';
      }
    | undefined;
  Meditacion:
    | {
        refreshToken?: number;
        sessionTypeSeleccionada?: MeditationSessionType;
      }
    | undefined;
  RegistrarMeditacion:
    | {
        mode?: 'quick' | 'manual';
        sessionTypeSeleccionada?: MeditationSessionType;
      }
    | undefined;
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

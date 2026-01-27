import type { User } from '../types/models';

export type SessionParams = {
  user?: User;
  token?: string;
};

export type RootStackParamList = {
  Login: undefined;
  PanelDiario: SessionParams | undefined;
  Habits: SessionParams | undefined;
  Feed: SessionParams | undefined;
};

export type FeedUser = {
  id: number;
  username?: string;
  correo?: string;
  nombre?: string;
  preferencias?: Record<string, unknown> | string | null;
  f_creacion?: string;
  id_usuario?: number;
};

export type RootStackParamList = {
  Login: undefined;
  Habits: { user: FeedUser };
  Feed: { user: FeedUser };
};

export type UserSummary = {
  id: number;
  username?: string;
  correo?: string;
  nombre?: string;
  preferencias?: Record<string, unknown> | null;
  f_creacion?: string;
};

export type LoginRequest = {
  correo?: string;
  username?: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: UserSummary;
};

export type RegisterRequest = {
  correo: string;
  nombre: string;
  password: string;
  preferencias?: Record<string, unknown> | null;
};

export type RegisterResponse = {
  message: string;
  user: UserSummary;
};

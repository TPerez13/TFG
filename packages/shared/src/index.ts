export type UserSummary = {
  id: number;
  username: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: UserSummary;
};

import bcrypt from "bcryptjs";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserSummary,
} from "@muchasvidas/shared";
import { AppError } from "../utils/errors";
import { signAccessToken } from "../utils/jwt";
import type { UserRecord } from "../model/userModel";
import { createUser, findByEmail } from "../model/userModel";

const DEFAULT_PREFERENCIAS: Record<string, unknown> = {
  tema: "system",
  idioma: "es",
  quiet_hours: {
    desde: "23:00",
    hasta: "07:00",
  },
  notificaciones: {
    enabled: true,
    reminders: true,
    achievements: true,
    challenges: true,
    system: true,
    hydration: true,
    nutrition: true,
    exercise: true,
    sleep: true,
    gamification: true,
    weeklyReport: false,
    weeklyDay: "L",
    weeklyTime: "08:00",
    pushEnabled: true,
    emailEnabled: false,
    quietHoursEnabled: false,
    quietFrom: "22:00",
    quietTo: "07:00",
  },
};

const toIsoString = (value: unknown): string | undefined => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
};

const toUserSummary = (user: UserRecord): UserSummary => ({
  id: user.id_usuario,
  correo: user.correo,
  nombre: user.nombre,
  preferencias: user.preferencias ?? null,
  f_creacion: toIsoString(user.f_creacion),
});

/**
 * Business logic for user authentication.
 * Validates input, queries the user repository and compares password hashes.
 * Side effects: database reads.
 */
export async function login(payload: Partial<LoginRequest>): Promise<LoginResponse> {
  const { correo, username, password } = payload || {};
  const identifier = correo ?? username;

  if (!identifier || !password) {
    throw new AppError("Correo y contrasena son requeridos.", 400);
  }

  const user = await findByEmail(identifier);

  if (!user) {
    throw new AppError("Credenciales invalidas.", 401);
  }

  const isValid = await bcrypt.compare(password, user.hash_clave);

  if (!isValid) {
    throw new AppError("Credenciales invalidas.", 401);
  }

  const response: LoginResponse = {
    message: "Inicio de sesion correcto.",
    user: toUserSummary(user),
    token: signAccessToken(user.id_usuario),
  };

  return response;
}

/**
 * Business logic for user registration.
 * Validates input, enforces uniqueness and stores the password hash.
 * Side effects: database reads and writes.
 */
export async function register(payload: Partial<RegisterRequest>): Promise<RegisterResponse> {
  const { correo, nombre, password, preferencias } = payload || {};

  if (!correo || !nombre || !password) {
    throw new AppError("Nombre, correo y contrasena son requeridos.", 400);
  }

  const existing = await findByEmail(correo);

  if (existing) {
    throw new AppError("El correo ya esta registrado.", 409);
  }

  const hash = await bcrypt.hash(password, 10);
  // TODO: validate/normalize preferences when the contract is defined.
  const user = await createUser({
    correo,
    nombre,
    hash_clave: hash,
    preferencias: preferencias ?? DEFAULT_PREFERENCIAS,
  });

  const response: RegisterResponse = {
    message: "Registro correcto.",
    user: toUserSummary(user),
    token: signAccessToken(user.id_usuario),
  };

  return response;
}

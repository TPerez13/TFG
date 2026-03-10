import bcrypt from "bcryptjs";
import { createHash, randomInt } from "crypto";
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
import { createUser, findByEmail, updatePasswordHash } from "../model/userModel";
import { createPasswordResetToken, consumePasswordResetToken } from "../model/passwordResetModel";

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

const PASSWORD_RESET_EXPIRATION_MINUTES = 15;

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

const hashResetCode = (value: string): string => createHash("sha256").update(value).digest("hex");

const generateResetCode = (): string => randomInt(0, 1_000_000).toString().padStart(6, "0");

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

export async function requestPasswordReset(payload: { correo?: string }): Promise<{
  message: string;
  devResetCode?: string;
}> {
  const correo = (payload?.correo ?? "").trim();
  if (!correo) {
    throw new AppError("Correo requerido.", 400);
  }

  const genericMessage =
    "Si el correo existe, enviamos instrucciones para restablecer la contrasena.";
  const user = await findByEmail(correo);
  if (!user) {
    return { message: genericMessage };
  }

  const resetCode = generateResetCode();
  const tokenHash = hashResetCode(resetCode);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MINUTES * 60 * 1000);

  await createPasswordResetToken(user.id_usuario, tokenHash, expiresAt);

  if (process.env.NODE_ENV !== "production") {
    return {
      message: genericMessage,
      devResetCode: resetCode,
    };
  }

  return { message: genericMessage };
}

export async function resetPassword(payload: {
  correo?: string;
  code?: string;
  newPassword?: string;
}): Promise<{ message: string }> {
  const correo = (payload?.correo ?? "").trim();
  const code = (payload?.code ?? "").trim();
  const newPassword = payload?.newPassword ?? "";

  if (!correo || !code || !newPassword) {
    throw new AppError("Correo, codigo y nueva contrasena son requeridos.", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("La nueva contrasena debe tener al menos 6 caracteres.", 400);
  }

  const user = await findByEmail(correo);
  if (!user) {
    throw new AppError("Codigo invalido o expirado.", 400);
  }

  const tokenHash = hashResetCode(code);
  const tokenConsumed = await consumePasswordResetToken(user.id_usuario, tokenHash, new Date());
  if (!tokenConsumed) {
    throw new AppError("Codigo invalido o expirado.", 400);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  const updated = await updatePasswordHash(user.id_usuario, hash);
  if (!updated) {
    throw new AppError("Usuario no encontrado.", 404);
  }

  return { message: "Contrasena restablecida correctamente." };
}

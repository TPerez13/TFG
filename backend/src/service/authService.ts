import bcrypt from "bcryptjs";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserSummary,
} from "@muchasvidas/shared";
import { AppError } from "../utils/errors";
import type { UserRecord } from "../model/userModel";
import { createUser, findByEmail } from "../model/userModel";

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

// Logica de negocio de autenticacion: valida input, busca usuario y compara el hash de contrasena.
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
  };

  return response;
}

// Registro de usuario: valida input, evita duplicados y almacena el hash.
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
  const user = await createUser({
    correo,
    nombre,
    hash_clave: hash,
    preferencias: preferencias ?? null,
  });

  const response: RegisterResponse = {
    message: "Registro correcto.",
    user: toUserSummary(user),
  };

  return response;
}

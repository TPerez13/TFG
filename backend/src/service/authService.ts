import bcrypt from "bcryptjs";
import type { LoginRequest, LoginResponse } from "@muchasvidas/shared";
import { AppError } from "../utils/errors";
import { findByUsername } from "../model/userModel";

// Lógica de negocio de autenticación: valida input, busca usuario y compara el hash de contraseña.
export async function login(payload: Partial<LoginRequest>): Promise<LoginResponse> {
  const { username, password } = payload || {};

  if (!username || !password) {
    throw new AppError("Usuario y contraseña son requeridos.", 400);
  }

  const user = await findByUsername(username);

  if (!user) {
    throw new AppError("Credenciales inválidas.", 401);
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new AppError("Credenciales inválidas.", 401);
  }

  const response: LoginResponse = {
    message: "Inicio de sesión correcto.",
    user: { id: user.id, username: user.username },
  };

  return response;
}

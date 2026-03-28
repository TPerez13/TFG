import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import bcrypt from "bcryptjs";
import * as passwordResetModel from "../../src/model/passwordResetModel";
import * as userModel from "../../src/model/userModel";
import * as authService from "../../src/service/authService";
import * as jwtUtils from "../../src/utils/jwt";
import { assertRejectsAppError } from "../helpers/assertions";

const baseUser = {
  id_usuario: 7,
  correo: "ana@example.com",
  nombre: "Ana",
  hash_clave: "hashed-password",
  preferencias: { tema: "system" },
  f_creacion: "2026-03-10T12:00:00.000Z",
};

afterEach(() => {
  mock.restoreAll();
});

describe("authService", () => {
  it("rejects login when credentials are incomplete", async () => {
    await assertRejectsAppError(
      authService.login({ correo: "ana@example.com" }),
      400,
      "Correo y contrasena son requeridos."
    );
  });

  it("rejects login when the user does not exist", async () => {
    mock.method(userModel, "findByEmail", async () => null);

    await assertRejectsAppError(
      authService.login({ correo: "ana@example.com", password: "secret" }),
      401,
      "Credenciales invalidas."
    );
  });

  it("returns a token and summary on successful login", async () => {
    mock.method(userModel, "findByEmail", async () => baseUser);
    mock.method(bcrypt, "compare", async () => true);
    mock.method(jwtUtils, "signAccessToken", () => "signed-token");

    const result = await authService.login({
      correo: "ana@example.com",
      password: "secret",
    });

    assert.deepEqual(result, {
      message: "Inicio de sesion correcto.",
      user: {
        id: 7,
        correo: "ana@example.com",
        nombre: "Ana",
        preferencias: { tema: "system" },
        f_creacion: "2026-03-10T12:00:00.000Z",
      },
      token: "signed-token",
    });
  });

  it("rejects register when the email is already in use", async () => {
    mock.method(userModel, "findByEmail", async () => baseUser);

    await assertRejectsAppError(
      authService.register({
        correo: "ana@example.com",
        nombre: "Ana",
        password: "secret",
      }),
      409,
      "El correo ya esta registrado."
    );
  });

  it("hashes the password and applies default preferences on register", async () => {
    let createdInput: userModel.CreateUserInput | undefined;

    mock.method(userModel, "findByEmail", async () => null);
    mock.method(bcrypt, "hash", async () => "new-hash");
    mock.method(userModel, "createUser", async (input: userModel.CreateUserInput) => {
      createdInput = input;
      return {
        ...baseUser,
        correo: input.correo,
        nombre: input.nombre,
        hash_clave: input.hash_clave,
        preferencias: input.preferencias,
      };
    });
    mock.method(jwtUtils, "signAccessToken", () => "signed-token");

    const result = await authService.register({
      correo: "nuevo@example.com",
      nombre: "Nuevo",
      password: "secret",
    });

    assert.equal(createdInput?.correo, "nuevo@example.com");
    assert.equal(createdInput?.nombre, "Nuevo");
    assert.equal(createdInput?.hash_clave, "new-hash");
    assert.equal(typeof createdInput?.preferencias, "object");
    assert.equal(
      (createdInput?.preferencias as Record<string, unknown>)?.tema,
      "system"
    );
    assert.deepEqual(result, {
      message: "Registro correcto.",
      user: {
        id: 7,
        correo: "nuevo@example.com",
        nombre: "Nuevo",
        preferencias: createdInput?.preferencias ?? null,
        f_creacion: "2026-03-10T12:00:00.000Z",
      },
      token: "signed-token",
    });
  });

  it("returns the same generic message when a password reset email does not exist", async () => {
    mock.method(userModel, "findByEmail", async () => null);

    const result = await authService.requestPasswordReset({ correo: "missing@example.com" });

    assert.deepEqual(result, {
      message: "Si el correo existe, enviamos instrucciones para restablecer la contrasena.",
    });
  });

  it("creates a reset token and exposes the dev code outside production", async () => {
    let savedReset: {
      expiresAt?: Date;
      tokenHash?: string;
      userId?: number;
    } = {};

    mock.method(userModel, "findByEmail", async () => baseUser);
    mock.method(
      passwordResetModel,
      "createPasswordResetToken",
      async (userId: number, tokenHash: string, expiresAt: Date) => {
        savedReset = { userId, tokenHash, expiresAt };
      }
    );

    const result = await authService.requestPasswordReset({ correo: "ana@example.com" });

    assert.equal(result.message, "Si el correo existe, enviamos instrucciones para restablecer la contrasena.");
    assert.match(result.devResetCode ?? "", /^\d{6}$/);
    assert.equal(savedReset.userId, 7);
    assert.match(savedReset.tokenHash ?? "", /^[a-f0-9]{64}$/);
    assert.ok(savedReset.expiresAt instanceof Date);
  });

  it("rejects password reset when the new password is too short", async () => {
    await assertRejectsAppError(
      authService.resetPassword({
        correo: "ana@example.com",
        code: "123456",
        newPassword: "123",
      }),
      400,
      "La nueva contrasena debe tener al menos 6 caracteres."
    );
  });

  it("consumes the reset token and updates the password hash", async () => {
    let consumedArgs: unknown[] = [];
    let updatedArgs: unknown[] = [];

    mock.method(userModel, "findByEmail", async () => baseUser);
    mock.method(
      passwordResetModel,
      "consumePasswordResetToken",
      async (...args: unknown[]) => {
        consumedArgs = args;
        return true;
      }
    );
    mock.method(bcrypt, "hash", async () => "updated-hash");
    mock.method(userModel, "updatePasswordHash", async (...args: unknown[]) => {
      updatedArgs = args;
      return true;
    });

    const result = await authService.resetPassword({
      correo: "ana@example.com",
      code: "654321",
      newPassword: "123456",
    });

    assert.deepEqual(result, { message: "Contrasena restablecida correctamente." });
    assert.equal(consumedArgs[0], 7);
    assert.match(String(consumedArgs[1]), /^[a-f0-9]{64}$/);
    assert.ok(consumedArgs[2] instanceof Date);
    assert.deepEqual(updatedArgs, [7, "updated-hash"]);
  });
});

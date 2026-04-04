import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

const withMailEnv = (values: Partial<Record<"MAIL_FROM" | "MAIL_PROVIDER" | "RESEND_API_KEY", string>>) => {
  const previous = {
    MAIL_FROM: process.env.MAIL_FROM,
    MAIL_PROVIDER: process.env.MAIL_PROVIDER,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  };

  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }

  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
};

afterEach(() => {
  mock.restoreAll();
});

describe("authService", () => {
  it("rejects login when credentials are incomplete", async () => {
    await assertRejectsAppError(
      authService.login({ correo: "ana@example.com" }),
      400,
      "Correo y contraseña son requeridos."
    );
  });

  it("rejects login when the user does not exist", async () => {
    mock.method(userModel, "findByEmail", async () => null);

    await assertRejectsAppError(
      authService.login({ correo: "ana@example.com", password: "secret" }),
      401,
      "Credenciales inválidas."
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
      message: "Inicio de sesión correcto.",
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
      "El correo ya está registrado."
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
    const restoreEnv = withMailEnv({
      MAIL_PROVIDER: "resend",
      MAIL_FROM: "no-reply@example.com",
      RESEND_API_KEY: "re_test",
    });

    mock.method(userModel, "findByEmail", async () => null);

    try {
      const result = await authService.requestPasswordReset({ correo: "missing@example.com" });

      assert.deepEqual(result, {
        message: "Si el correo existe, enviamos instrucciones para restablecer la contraseña.",
      });
      assert.equal("code" in result, false);
    } finally {
      restoreEnv();
    }
  });

  it("creates a hashed reset token, attempts email delivery and never returns the code", async () => {
    let savedReset: {
      expiresAt?: Date;
      tokenHash?: string;
      userId?: number;
    } = {};
    let resendRequestBody: Record<string, unknown> | undefined;
    let resendRequestUrl = "";
    const restoreEnv = withMailEnv({
      MAIL_PROVIDER: "resend",
      MAIL_FROM: "no-reply@example.com",
      RESEND_API_KEY: "re_test",
    });

    mock.method(userModel, "findByEmail", async () => baseUser);
    mock.method(
      passwordResetModel,
      "createPasswordResetToken",
      async (userId: number, tokenHash: string, expiresAt: Date) => {
        savedReset = { userId, tokenHash, expiresAt };
      }
    );
    mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
      resendRequestUrl = String(url);
      resendRequestBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      return new Response(JSON.stringify({ id: "mail_123" }), { status: 200 });
    });

    try {
      const result = await authService.requestPasswordReset({ correo: "ana@example.com" });
      const deliveredCode = /Código temporal: (\d{6})/.exec(
        String(resendRequestBody?.text ?? "")
      )?.[1];

      assert.equal(result.message, "Si el correo existe, enviamos instrucciones para restablecer la contraseña.");
      assert.deepEqual(Object.keys(result).sort(), ["message"]);
      assert.equal(savedReset.userId, 7);
      assert.ok(savedReset.expiresAt instanceof Date);
      assert.equal(resendRequestUrl, "https://api.resend.com/emails");
      assert.deepEqual(resendRequestBody?.to, ["ana@example.com"]);
      assert.equal(resendRequestBody?.from, "no-reply@example.com");
      assert.equal(typeof deliveredCode, "string");
      assert.notEqual(savedReset.tokenHash, deliveredCode);
      assert.equal(
        savedReset.tokenHash,
        createHash("sha256").update(deliveredCode ?? "").digest("hex")
      );
    } finally {
      restoreEnv();
    }
  });

  it("requires email delivery configuration when the provider is missing", async () => {
    const previousMailProvider = process.env.MAIL_PROVIDER;
    let findByEmailCalls = 0;

    delete process.env.MAIL_PROVIDER;
    mock.method(userModel, "findByEmail", async () => {
      findByEmailCalls += 1;
      return baseUser;
    });

    try {
      await assertRejectsAppError(
        authService.requestPasswordReset({ correo: "ana@example.com" }),
        503,
        "La recuperación por correo no está disponible en este momento."
      );
      assert.equal(findByEmailCalls, 0);
    } finally {
      if (previousMailProvider === undefined) {
        delete process.env.MAIL_PROVIDER;
      } else {
        process.env.MAIL_PROVIDER = previousMailProvider;
      }
    }
  });

  it("removes the stored reset token and returns a real delivery error when Resend rejects the email", async () => {
    let deletedUserId: number | undefined;
    const restoreEnv = withMailEnv({
      MAIL_PROVIDER: "resend",
      MAIL_FROM: "onboarding@resend.dev",
      RESEND_API_KEY: "re_test",
    });

    mock.method(userModel, "findByEmail", async () => baseUser);
    mock.method(passwordResetModel, "createPasswordResetToken", async () => undefined);
    mock.method(passwordResetModel, "deletePasswordResetTokensByUserId", async (userId: number) => {
      deletedUserId = userId;
    });
    mock.method(globalThis, "fetch", async () =>
      new Response(JSON.stringify({ message: "You can only send testing emails to your account email address." }), {
        status: 403,
      })
    );

    try {
      await assertRejectsAppError(
        authService.requestPasswordReset({ correo: "ana@example.com" }),
        503,
        "No se pudo enviar el correo de recuperación. Con onboarding@resend.dev solo puedes enviar al correo propietario de la cuenta de Resend; para destinatarios externos necesitas un dominio verificado y MAIL_FROM con ese dominio."
      );
      assert.equal(deletedUserId, 7);
    } finally {
      restoreEnv();
    }
  });

  it("rejects password reset when the new password is too short", async () => {
    await assertRejectsAppError(
      authService.resetPassword({
        correo: "ana@example.com",
        code: "123456",
        newPassword: "123",
      }),
      400,
      "La nueva contraseña debe tener al menos 6 caracteres."
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
        return "consumed";
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

    assert.deepEqual(result, { message: "Contraseña restablecida correctamente." });
    assert.equal(consumedArgs[0], 7);
    assert.match(String(consumedArgs[1]), /^[a-f0-9]{64}$/);
    assert.ok(consumedArgs[2] instanceof Date);
    assert.deepEqual(updatedArgs, [7, "updated-hash"]);
  });

  it("rejects password reset when the code has expired", async () => {
    mock.method(userModel, "findByEmail", async () => baseUser);
    mock.method(passwordResetModel, "consumePasswordResetToken", async () => "expired");

    await assertRejectsAppError(
      authService.resetPassword({
        correo: "ana@example.com",
        code: "654321",
        newPassword: "123456",
      }),
      400,
      "El código de recuperación ha expirado."
    );
  });

  it("rejects password reset when the code was already used", async () => {
    mock.method(userModel, "findByEmail", async () => baseUser);
    mock.method(passwordResetModel, "consumePasswordResetToken", async () => "already_used");

    await assertRejectsAppError(
      authService.resetPassword({
        correo: "ana@example.com",
        code: "654321",
        newPassword: "123456",
      }),
      400,
      "El código de recuperación ya fue utilizado."
    );
  });
});

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { createApp } from "../../src/app";
import * as authService from "../../src/service/authService";
import { AppError } from "../../src/utils/errors";
import { requestJson, startTestServer } from "../helpers/http";

afterEach(() => {
  mock.restoreAll();
});

beforeEach(() => {
  mock.method(console, "log", () => undefined);
  mock.method(console, "error", () => undefined);
});

describe("auth routes integration", () => {
  it("POST /api/login returns the service response", async () => {
    let receivedPayload: unknown;

    mock.method(authService, "login", async (payload: Parameters<typeof authService.login>[0]) => {
      receivedPayload = payload;
      return {
        message: "Inicio de sesión correcto.",
        user: {
          id: 7,
          correo: "ana@example.com",
          nombre: "Ana",
          preferencias: { tema: "system" },
          f_creacion: "2026-03-10T12:00:00.000Z",
        },
        token: "signed-token",
      };
    });

    const server = await startTestServer(createApp());

    try {
      const response = await requestJson(server.baseUrl, {
        method: "POST",
        path: "/api/login",
        body: { correo: "ana@example.com", password: "secret" },
      });

      assert.deepEqual(receivedPayload, {
        correo: "ana@example.com",
        password: "secret",
      });
      assert.equal(response.status, 200);
      assert.deepEqual(response.json, {
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
    } finally {
      await server.close();
    }
  });

  it("POST /api/register returns 201 with the created user", async () => {
    mock.method(authService, "register", async () => ({
      message: "Registro correcto.",
      user: {
        id: 9,
        correo: "nuevo@example.com",
        nombre: "Nuevo",
        preferencias: { tema: "system" },
        f_creacion: "2026-03-10T12:00:00.000Z",
      },
      token: "register-token",
    }));

    const server = await startTestServer(createApp());

    try {
      const response = await requestJson(server.baseUrl, {
        method: "POST",
        path: "/api/register",
        body: {
          correo: "nuevo@example.com",
          nombre: "Nuevo",
          password: "secret",
        },
      });

      assert.equal(response.status, 201);
      assert.deepEqual(response.json, {
        message: "Registro correcto.",
        user: {
          id: 9,
          correo: "nuevo@example.com",
          nombre: "Nuevo",
          preferencias: { tema: "system" },
          f_creacion: "2026-03-10T12:00:00.000Z",
        },
        token: "register-token",
      });
    } finally {
      await server.close();
    }
  });

  it("POST /api/password/forgot delegates to the auth service", async () => {
    mock.method(authService, "requestPasswordReset", async () => ({
      message: "Si el correo existe, enviamos instrucciones para restablecer la contraseña.",
      devResetCode: "123456",
    }));

    const server = await startTestServer(createApp());

    try {
      const response = await requestJson(server.baseUrl, {
        method: "POST",
        path: "/api/password/forgot",
        body: { correo: "ana@example.com" },
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.json, {
        message: "Si el correo existe, enviamos instrucciones para restablecer la contraseña.",
        devResetCode: "123456",
      });
    } finally {
      await server.close();
    }
  });

  it("POST /api/password/reset maps AppError through the error handler", async () => {
    mock.method(authService, "resetPassword", async () => {
      throw new AppError("Código inválido o expirado.", 400);
    });

    const server = await startTestServer(createApp());

    try {
      const response = await requestJson(server.baseUrl, {
        method: "POST",
        path: "/api/password/reset",
        body: {
          correo: "ana@example.com",
          code: "123456",
          newPassword: "secret123",
        },
      });

      assert.equal(response.status, 400);
      assert.deepEqual(response.json, {
        message: "Código inválido o expirado.",
      });
    } finally {
      await server.close();
    }
  });
});

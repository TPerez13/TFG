import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { createApp } from "../../src/app";
import * as habitModel from "../../src/model/habitModel";
import * as notificationSettingsService from "../../src/service/notificationSettingsService";
import * as jwtUtils from "../../src/utils/jwt";
import { requestJson, startTestServer } from "../helpers/http";

afterEach(() => {
  mock.restoreAll();
});

beforeEach(() => {
  mock.method(console, "log", () => undefined);
  mock.method(console, "error", () => undefined);
});

describe("habits routes integration", () => {
  it("GET /api/habits/entries requires a bearer token", async () => {
    const server = await startTestServer(createApp());

    try {
      const response = await requestJson(server.baseUrl, {
        method: "GET",
        path: "/api/habits/entries?from=2026-03-01&to=2026-03-31",
      });

      assert.equal(response.status, 401);
      assert.deepEqual(response.json, { message: "Token requerido." });
    } finally {
      await server.close();
    }
  });

  it("GET /api/habits/entries returns mapped entries for the authenticated user", async () => {
    let receivedArgs: unknown[] = [];

    mock.method(jwtUtils, "verifyAccessToken", () => ({ sub: "9" }));
    mock.method(habitModel, "listEntriesForUser", async (...args: unknown[]) => {
      receivedArgs = args;
      return [
        {
          id_registro_habito: 31,
          id_usuario: 9,
          id_tipo_habito: 2,
          f_registro: "2026-03-05T10:00:00.000Z",
          valor: 3,
          unidad: "vasos",
          notas: null,
        },
      ];
    });

    const server = await startTestServer(createApp());

    try {
      const response = await requestJson(server.baseUrl, {
        method: "GET",
        path: "/api/habits/entries?from=2026-03-01&to=2026-03-31&typeId=2",
        headers: { authorization: "Bearer valid-token" },
      });

      assert.deepEqual(receivedArgs, [
        9,
        "2026-03-01T00:00:00.000Z",
        "2026-03-31T23:59:59.999Z",
        2,
      ]);
      assert.equal(response.status, 200);
      assert.deepEqual(response.json, {
        entries: [
          {
            id_registro_habito: 31,
            id_usuario: 9,
            id_tipo_habito: 2,
            f_registro: "2026-03-05T10:00:00.000Z",
            valor: 3,
            unidad: "vasos",
            notas: null,
          },
        ],
      });
    } finally {
      await server.close();
    }
  });

  it("POST /api/habits/entries creates an entry for the authenticated user", async () => {
    let createdInput: habitModel.CreateHabitEntryInput | undefined;
    let notificationArgs: unknown[] = [];

    mock.method(jwtUtils, "verifyAccessToken", () => ({ sub: "9" }));
    mock.method(
      habitModel,
      "createHabitEntryForUser",
      async (input: habitModel.CreateHabitEntryInput) => {
      createdInput = input;
      return {
        id_registro_habito: 41,
        id_usuario: input.userId,
        id_tipo_habito: input.typeId,
        f_registro: input.dateTimeIso,
        valor: input.value,
        unidad: input.unit ?? null,
        notas: input.notes ?? null,
      };
    });
    mock.method(
      notificationSettingsService,
      "markHabitRecordedToday",
      async (...args: unknown[]) => {
        notificationArgs = args;
      }
    );

    const server = await startTestServer(createApp());

    try {
      const response = await requestJson(server.baseUrl, {
        method: "POST",
        path: "/api/habits/entries",
        headers: { authorization: "Bearer valid-token" },
        body: {
          typeId: 1,
          value: 2.5,
          unit: "vasos",
          notes: "manana",
          dateTime: "2026-03-05T10:00:00.000Z",
        },
      });

      assert.deepEqual(createdInput, {
        userId: 9,
        typeId: 1,
        value: 2.5,
        unit: "vasos",
        notes: "manana",
        dateTimeIso: "2026-03-05T10:00:00.000Z",
      });
      assert.deepEqual(notificationArgs, [9, "hidratacion", "2026-03-05T10:00:00.000Z"]);
      assert.equal(response.status, 201);
      assert.deepEqual(response.json, {
        entry: {
          id_registro_habito: 41,
          id_usuario: 9,
          id_tipo_habito: 1,
          f_registro: "2026-03-05T10:00:00.000Z",
          valor: 2.5,
          unidad: "vasos",
          notas: "manana",
        },
      });
    } finally {
      await server.close();
    }
  });

  it("DELETE /api/habits/entries/:id removes the selected entry", async () => {
    let deleteArgs: unknown[] = [];

    mock.method(jwtUtils, "verifyAccessToken", () => ({ sub: "9" }));
    mock.method(habitModel, "deleteHabitEntryForUser", async (...args: unknown[]) => {
      deleteArgs = args;
      return {
        id_registro_habito: 41,
        id_usuario: 9,
        id_tipo_habito: 1,
        f_registro: "2026-03-05T10:00:00.000Z",
        valor: 2.5,
        unidad: "vasos",
        notas: "manana",
      };
    });

    const server = await startTestServer(createApp());

    try {
      const response = await requestJson(server.baseUrl, {
        method: "DELETE",
        path: "/api/habits/entries/41",
        headers: { authorization: "Bearer valid-token" },
      });

      assert.deepEqual(deleteArgs, [9, 41]);
      assert.equal(response.status, 200);
      assert.deepEqual(response.json, {
        ok: true,
        entry: {
          id_registro_habito: 41,
          id_usuario: 9,
          id_tipo_habito: 1,
          f_registro: "2026-03-05T10:00:00.000Z",
          valor: 2.5,
          unidad: "vasos",
          notas: "manana",
        },
      });
    } finally {
      await server.close();
    }
  });
});

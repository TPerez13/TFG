import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import * as habitController from "../../src/controllers/habitController";
import * as habitModel from "../../src/model/habitModel";
import * as notificationSettingsService from "../../src/service/notificationSettingsService";
import { assertIsAppError } from "../helpers/assertions";
import { createMockResponse, createNextSpy } from "../helpers/express";

afterEach(() => {
  mock.restoreAll();
});

beforeEach(() => {
  mock.method(console, "log", () => undefined);
  mock.method(console, "error", () => undefined);
});

describe("habitController", () => {
  it("rejects listEntries when the request is not authenticated", async () => {
    const req = {
      query: { from: "2026-03-01", to: "2026-03-31" },
    } as unknown as Request;
    const res = createMockResponse();
    const { calls, next } = createNextSpy();

    await habitController.listEntries(req, res as Response, next);

    assert.equal(calls.length, 1);
    assertIsAppError(calls[0], 401, "Token invalido.");
  });

  it("rejects legacy listEntries query parameters", async () => {
    const req = {
      userId: 5,
      query: {
        from: "2026-03-01",
        to: "2026-03-31",
        id_tipo_habito: "2",
      },
    } as unknown as Request;
    const res = createMockResponse();
    const { calls, next } = createNextSpy();

    await habitController.listEntries(req, res as Response, next);

    assert.equal(calls.length, 1);
    assertIsAppError(calls[0], 400, "Contrato invalido: usa query param typeId.");
  });

  it("maps records and expands date-only boundaries in listEntries", async () => {
    let receivedArgs: unknown[] = [];

    mock.method(habitModel, "listEntriesForUser", async (...args: unknown[]) => {
      receivedArgs = args;
      return [
        {
          id_registro_habito: 11,
          id_usuario: 5,
          id_tipo_habito: 2,
          f_registro: "2026-03-02T08:30:00.000Z",
          valor: 2.5,
          unidad: "vasos",
          notas: "manana",
        },
      ];
    });

    const req = {
      userId: 5,
      query: { from: "2026-03-01", to: "2026-03-02", typeId: "2" },
    } as unknown as Request;
    const res = createMockResponse();
    const { calls, next } = createNextSpy();

    await habitController.listEntries(req, res as Response, next);

    assert.deepEqual(receivedArgs, [
      5,
      "2026-03-01T00:00:00.000Z",
      "2026-03-02T23:59:59.999Z",
      2,
    ]);
    assert.equal(calls.length, 0);
    assert.deepEqual(res.body, {
      entries: [
        {
          id_registro_habito: 11,
          id_usuario: 5,
          id_tipo_habito: 2,
          f_registro: "2026-03-02T08:30:00.000Z",
          valor: 2.5,
          unidad: "vasos",
          notas: "manana",
        },
      ],
    });
  });

  it("rejects legacy createEntry payloads", async () => {
    const req = {
      userId: 5,
      body: { id_tipo_habito: 1, valor: 2 },
    } as unknown as Request;
    const res = createMockResponse();
    const { calls, next } = createNextSpy();

    await habitController.createEntry(req, res as Response, next);

    assert.equal(calls.length, 1);
    assertIsAppError(
      calls[0],
      400,
      "Contrato invalido: usa body { typeId, value, unit?, dateTime?, notes? }."
    );
  });

  it("creates an entry with normalized values and updates notification progress", async () => {
    let createdInput: habitModel.CreateHabitEntryInput | undefined;
    let notificationArgs: unknown[] = [];

    mock.method(
      habitModel,
      "createHabitEntryForUser",
      async (input: habitModel.CreateHabitEntryInput) => {
      createdInput = input;
      return {
        id_registro_habito: 21,
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

    const req = {
      userId: 5,
      body: {
        typeId: "1",
        value: "2.5",
        unit: " vasos ",
        notes: " manana ",
        dateTime: "2026-03-02T08:30:00.000Z",
      },
    } as unknown as Request;
    const res = createMockResponse();
    const { calls, next } = createNextSpy();

    await habitController.createEntry(req, res as Response, next);

    assert.equal(calls.length, 0);
    assert.deepEqual(createdInput, {
      userId: 5,
      typeId: 1,
      value: 2.5,
      unit: "vasos",
      notes: "manana",
      dateTimeIso: "2026-03-02T08:30:00.000Z",
    });
    assert.deepEqual(notificationArgs, [5, "hidratacion", "2026-03-02T08:30:00.000Z"]);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      entry: {
        id_registro_habito: 21,
        id_usuario: 5,
        id_tipo_habito: 1,
        f_registro: "2026-03-02T08:30:00.000Z",
        valor: 2.5,
        unidad: "vasos",
        notas: "manana",
      },
    });
  });

  it("rejects deleteEntry when the id is invalid", async () => {
    const req = {
      userId: 5,
      params: { id: "abc" },
    } as unknown as Request;
    const res = createMockResponse();
    const { calls, next } = createNextSpy();

    await habitController.deleteEntry(req, res as Response, next);

    assert.equal(calls.length, 1);
    assertIsAppError(calls[0], 400, "id invalido.");
  });

  it("returns not found when deleteEntry does not remove any record", async () => {
    mock.method(habitModel, "deleteHabitEntryForUser", async () => null);

    const req = {
      userId: 5,
      params: { id: "42" },
    } as unknown as Request;
    const res = createMockResponse();
    const { calls, next } = createNextSpy();

    await habitController.deleteEntry(req, res as Response, next);

    assert.equal(calls.length, 1);
    assertIsAppError(calls[0], 404, "Registro no encontrado.");
  });
});

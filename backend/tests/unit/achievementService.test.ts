import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import * as achievementModel from "../../src/models/achievementModel";
import * as habitModel from "../../src/models/habitModel";
import * as userModel from "../../src/models/userModel";
import * as achievementService from "../../src/services/achievementService";

const baseUser = {
  id_usuario: 7,
  correo: "ana@example.com",
  nombre: "Ana",
  hash_clave: "hashed-password",
  preferencias: null,
  f_creacion: "2026-03-01T10:00:00.000Z",
};

afterEach(() => {
  mock.restoreAll();
});

describe("achievementService", () => {
  it("awards newly unlocked achievements and returns the persisted unlock dates", async () => {
    const granted: unknown[][] = [];
    let unlockedReads = 0;

    mock.method(userModel, "findById", async () => baseUser);
    mock.method(habitModel, "listAllEntriesForUser", async () => [
      {
        id_registro_habito: 1,
        id_usuario: 7,
        id_tipo_habito: 1,
        f_registro: "2026-03-01T10:00:00.000Z",
        valor: 2000,
        unidad: "ml",
        notas: null,
      },
      {
        id_registro_habito: 2,
        id_usuario: 7,
        id_tipo_habito: 1,
        f_registro: "2026-03-02T10:00:00.000Z",
        valor: 2000,
        unidad: "ml",
        notas: null,
      },
      {
        id_registro_habito: 3,
        id_usuario: 7,
        id_tipo_habito: 1,
        f_registro: "2026-03-03T10:00:00.000Z",
        valor: 2000,
        unidad: "ml",
        notas: null,
      },
    ]);
    mock.method(achievementModel, "syncAchievementCatalog", async () => undefined);
    mock.method(
      achievementModel,
      "listUnlockedAchievementsForUser",
      async () => {
        unlockedReads += 1;
        return unlockedReads === 1
          ? []
          : [
              {
                achievementId: "FIRST_ENTRY",
                unlockedAt: "2026-03-01T10:00:00.000Z",
                points: 10,
              },
              {
                achievementId: "FIRST_WATER_ENTRY",
                unlockedAt: "2026-03-01T10:00:00.000Z",
                points: 10,
              },
              {
                achievementId: "STREAK_3",
                unlockedAt: "2026-03-03T10:00:00.000Z",
                points: 25,
              },
            ];
      }
    );
    mock.method(
      achievementModel,
      "grantAchievementToUser",
      async (...args: unknown[]) => {
        granted.push(args);
        return true;
      }
    );

    const result = await achievementService.getAchievementsForUser(7);
    const firstEntry = result.achievements.find((item) => item.id === "FIRST_ENTRY");
    const firstWaterEntry = result.achievements.find((item) => item.id === "FIRST_WATER_ENTRY");
    const streak3 = result.achievements.find((item) => item.id === "STREAK_3");
    const streak7 = result.achievements.find((item) => item.id === "STREAK_7");

    assert.deepEqual(granted, [
      [7, "FIRST_ENTRY", "2026-03-01T10:00:00.000Z", 10],
      [7, "FIRST_WATER_ENTRY", "2026-03-01T10:00:00.000Z", 10],
      [7, "STREAK_3", "2026-03-03T10:00:00.000Z", 25],
    ]);
    assert.equal(firstEntry?.unlocked, true);
    assert.equal(firstEntry?.unlockedAt, "2026-03-01T10:00:00.000Z");
    assert.equal(firstWaterEntry?.unlocked, true);
    assert.equal(firstWaterEntry?.unlockedAt, "2026-03-01T10:00:00.000Z");
    assert.equal(streak3?.unlocked, true);
    assert.equal(streak3?.unlockedAt, "2026-03-03T10:00:00.000Z");
    assert.equal(streak7?.unlocked, false);
    assert.deepEqual(streak7?.progress, {
      current: 3,
      target: 7,
    });
  });

  it("preserves achievements already stored in usuario_logro even if current entries no longer unlock them", async () => {
    let grantCalls = 0;

    mock.method(userModel, "findById", async () => baseUser);
    mock.method(habitModel, "listAllEntriesForUser", async () => []);
    mock.method(achievementModel, "syncAchievementCatalog", async () => undefined);
    mock.method(achievementModel, "listUnlockedAchievementsForUser", async () => [
      {
        achievementId: "MONTH_70",
        unlockedAt: "2026-02-28T12:00:00.000Z",
        points: 80,
      },
    ]);
    mock.method(achievementModel, "grantAchievementToUser", async () => {
      grantCalls += 1;
      return false;
    });

    const result = await achievementService.getAchievementsForUser(7);
    const month70 = result.achievements.find((item) => item.id === "MONTH_70");

    assert.equal(grantCalls, 0);
    assert.equal(month70?.unlocked, true);
    assert.equal(month70?.unlockedAt, "2026-02-28T12:00:00.000Z");
    assert.deepEqual(month70?.progress, {
      current: 70,
      target: 70,
    });
  });
});

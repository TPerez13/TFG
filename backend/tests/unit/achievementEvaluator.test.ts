import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateAchievements } from "../../src/services/achievementEvaluator";

const preferences = {
  goals: {
    agua: { value: 500, unit: "ml" },
    comidas: { value: 1, unit: "platos" },
    ejercicio: { value: 10, unit: "min" },
    sueno: { value: 1, unit: "h" },
    meditacion: { value: 5, unit: "min" },
  },
};

const entries = [
  "2026-03-01",
  "2026-03-02",
  "2026-03-03",
  "2026-03-04",
  "2026-03-05",
  "2026-03-06",
  "2026-03-07",
].flatMap((day, index) => {
  const baseEntries = [
    {
      id_registro_habito: index * 10 + 1,
      id_usuario: 9,
      id_tipo_habito: 1,
      f_registro: `${day}T08:00:00.000Z`,
      valor: 600,
      unidad: "ml",
      notas: null,
    },
  ];

  if (index === 6) {
    return baseEntries;
  }

  return [
    ...baseEntries,
    {
      id_registro_habito: index * 10 + 2,
      id_usuario: 9,
      id_tipo_habito: 2,
      f_registro: `${day}T12:00:00.000Z`,
      valor: 1,
      unidad: "plato",
      notas: null,
    },
    {
      id_registro_habito: index * 10 + 3,
      id_usuario: 9,
      id_tipo_habito: 3,
      f_registro: `${day}T18:00:00.000Z`,
      valor: 12,
      unidad: "min",
      notas: null,
    },
    {
      id_registro_habito: index * 10 + 4,
      id_usuario: 9,
      id_tipo_habito: 4,
      f_registro: `${day}T22:00:00.000Z`,
      valor: 7.5,
      unidad: "h",
      notas: null,
    },
    {
      id_registro_habito: index * 10 + 5,
      id_usuario: 9,
      id_tipo_habito: 5,
      f_registro: `${day}T22:30:00.000Z`,
      valor: 8,
      unidad: "min",
      notas: null,
    },
  ];
});

describe("achievementEvaluator", () => {
  it("evaluates the expanded catalog across first entries, totals, perfect days and habit-specific milestones", () => {
    const achievements = evaluateAchievements(entries, preferences);

    const firstWater = achievements.find((item) => item.id === "FIRST_WATER_ENTRY");
    const total10 = achievements.find((item) => item.id === "TOTAL_ENTRIES_10");
    const perfectDay3 = achievements.find((item) => item.id === "PERFECT_DAY_3");
    const week80 = achievements.find((item) => item.id === "WEEK_80");
    const week100 = achievements.find((item) => item.id === "WEEK_100");
    const water7 = achievements.find((item) => item.id === "WATER_7");

    assert.equal(firstWater?.unlockedAt, "2026-03-01T08:00:00.000Z");
    assert.equal(total10?.unlockedAt, "2026-03-02T22:30:00.000Z");
    assert.equal(perfectDay3?.unlockedAt, "2026-03-03T22:30:00.000Z");
    assert.equal(week80?.unlockedAt, "2026-03-07T08:00:00.000Z");
    assert.equal(week100?.unlockedAt, null);
    assert.deepEqual(week100?.progress, {
      current: 89,
      target: 100,
    });
    assert.equal(water7?.unlockedAt, "2026-03-07T08:00:00.000Z");
  });
});

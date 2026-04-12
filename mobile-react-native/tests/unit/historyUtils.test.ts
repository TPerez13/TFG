import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { HabitEntry } from '../../src/types/models';
import {
  aggregateByHabitAndDay,
  computeDailyPct,
  formatHabitValue,
  resolveHabitGoals,
} from '../../src/features/progress/historyUtils';

const entries: HabitEntry[] = [
  {
    id_registro_habito: 1,
    id_usuario: 7,
    id_tipo_habito: 1,
    f_registro: '2026-03-02T08:00:00.000Z',
    valor: 500,
    unidad: 'ml',
    notas: null,
  },
  {
    id_registro_habito: 2,
    id_usuario: 7,
    id_tipo_habito: 1,
    f_registro: '2026-03-02T09:00:00.000Z',
    valor: 300,
    unidad: 'ml',
    notas: null,
  },
  {
    id_registro_habito: 3,
    id_usuario: 7,
    id_tipo_habito: 3,
    f_registro: '2026-03-02T18:00:00.000Z',
    valor: 45,
    unidad: 'min',
    notas: null,
  },
];

describe('progress/historyUtils', () => {
  it('clamps daily progress percentage between 0 and 100', () => {
    assert.equal(computeDailyPct(5, 0), 0);
    assert.equal(computeDailyPct(2, 4), 50);
    assert.equal(computeDailyPct(12, 4), 100);
  });

  it('formats aggregated values according to the habit type', () => {
    assert.equal(formatHabitValue('agua', 2.2, 'vasos'), '2.2 vasos');
    assert.equal(formatHabitValue('sueno', 7.5, 'h'), '7h 30min');
    assert.equal(formatHabitValue('sueno', 465, 'min'), '7h 45min');
    assert.equal(formatHabitValue('meditacion', 12.4, 'min'), '12 min');
  });

  it('resolves habit goals from user preferences while preserving defaults', () => {
    const goals = resolveHabitGoals({
      goals: {
        agua: { value: 2500, unit: 'ml' },
        ejercicio: { value: 60, unit: 'min' },
      },
    });

    const agua = goals.find((item) => item.habitKey === 'agua');
    const ejercicio = goals.find((item) => item.habitKey === 'ejercicio');
    const comidas = goals.find((item) => item.habitKey === 'comidas');

    assert.equal(agua?.goalValue, 2500);
    assert.equal(agua?.goalUnit, 'ml');
    assert.equal(ejercicio?.goalValue, 60);
    assert.equal(comidas?.goalValue, 4);
  });

  it('aggregates entries by day and habit with totals, latest timestamp and achievement flag', () => {
    const goals = resolveHabitGoals({
      goals: {
        agua: { value: 800, unit: 'ml' },
      },
    });

    const aggregated = aggregateByHabitAndDay(entries, goals);
    const dayItems = aggregated.get('2026-03-02') ?? [];
    const agua = dayItems.find((item) => item.habitKey === 'agua');
    const ejercicio = dayItems.find((item) => item.habitKey === 'ejercicio');

    assert.equal(agua?.total, 800);
    assert.equal(agua?.latestAt, '2026-03-02T09:00:00.000Z');
    assert.equal(agua?.achieved, true);
    assert.equal(agua?.pct, 100);
    assert.equal(ejercicio?.total, 45);
    assert.equal(ejercicio?.achieved, true);
  });
});

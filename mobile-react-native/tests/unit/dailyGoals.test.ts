import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  evaluateDailyGoal,
  getHabitReminderPolicy,
  normalizeDailyGoalEntryValue,
  shouldScheduleHabitReminder,
} from '@muchasvidas/shared';
import type { HabitEntry } from '../../src/types/models';

const buildEntry = (overrides: Partial<HabitEntry>): HabitEntry => ({
  id_registro_habito: 1,
  id_usuario: 7,
  id_tipo_habito: 1,
  f_registro: '2026-03-02T12:00:00.000Z',
  valor: 1,
  unidad: 'ml',
  notas: null,
  ...overrides,
});

describe('shared/dailyGoals', () => {
  it('normalizes hydration entries against the configured goal unit', () => {
    const evaluation = evaluateDailyGoal({
      habitKey: 'agua',
      date: new Date('2026-03-02T15:00:00.000Z'),
      preferences: {
        goals: {
          agua: { value: 3, unit: 'vasos' },
        },
      },
      entries: [
        buildEntry({ id_registro_habito: 11, id_tipo_habito: 1, valor: 500, unidad: 'ml' }),
        buildEntry({ id_registro_habito: 12, id_tipo_habito: 1, valor: 1, unidad: 'vaso' }),
        buildEntry({ id_registro_habito: 13, id_tipo_habito: 1, f_registro: '2026-03-01T12:00:00.000Z', valor: 1000, unidad: 'ml' }),
      ],
    });

    assert.equal(evaluation.total, 3);
    assert.equal(evaluation.target, 3);
    assert.equal(evaluation.remaining, 0);
    assert.equal(evaluation.reached, true);
    assert.equal(shouldScheduleHabitReminder({ notificationKey: 'hidratacion', evaluation }), false);
  });

  it('counts nutrition entries as daily meals', () => {
    const evaluation = evaluateDailyGoal({
      habitKey: 'comidas',
      date: new Date('2026-03-02T20:00:00.000Z'),
      entries: [
        buildEntry({ id_registro_habito: 21, id_tipo_habito: 2, valor: 1, unidad: 'plato' }),
        buildEntry({ id_registro_habito: 22, id_tipo_habito: 2, valor: 1, unidad: 'plato' }),
      ],
    });

    assert.equal(evaluation.total, 2);
    assert.equal(evaluation.target, 4);
    assert.equal(evaluation.reached, false);
    assert.equal(shouldScheduleHabitReminder({ notificationKey: 'nutricion', evaluation }), true);
  });

  it('converts exercise duration to the target unit before evaluating the goal', () => {
    const value = normalizeDailyGoalEntryValue(
      'ejercicio',
      buildEntry({ id_registro_habito: 31, id_tipo_habito: 3, valor: 1, unidad: 'hora' }),
      'min',
    );

    assert.equal(value, 60);
  });

  it('keeps sleep reminders on a fixed schedule instead of using goal completion', () => {
    const policy = getHabitReminderPolicy('sueno');

    assert.equal(policy.kind, 'schedule_based');
    assert.equal(shouldScheduleHabitReminder({ notificationKey: 'sueno' }), true);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveMonthlyAchievementTitle } from '../../src/features/progress/useMonthlyProgress';

describe('useMonthlyProgress', () => {
  it('returns a neutral title when the month has no data', () => {
    assert.equal(
      resolveMonthlyAchievementTitle({
        entriesCount: 0,
        goalsCount: 0,
        isEmpty: true,
        maxMetHabitsInDay: 0,
        monthlyAvg: 0,
        streakDays: 0,
        bestWeekPct: 0,
      }),
      'Sin logro destacado',
    );
  });

  it('prioritizes the monthly consistency milestone', () => {
    assert.equal(
      resolveMonthlyAchievementTitle({
        entriesCount: 18,
        goalsCount: 5,
        isEmpty: false,
        maxMetHabitsInDay: 5,
        monthlyAvg: 74,
        streakDays: 8,
        bestWeekPct: 86,
      }),
      'Mes consistente',
    );
  });

  it('falls back to perfect day when there is no stronger monthly milestone yet', () => {
    assert.equal(
      resolveMonthlyAchievementTitle({
        entriesCount: 4,
        goalsCount: 5,
        isEmpty: false,
        maxMetHabitsInDay: 5,
        monthlyAvg: 42,
        streakDays: 1,
        bestWeekPct: 54,
      }),
      'Día perfecto',
    );
  });

  it('uses first entry as the minimal non-empty achievement', () => {
    assert.equal(
      resolveMonthlyAchievementTitle({
        entriesCount: 1,
        goalsCount: 5,
        isEmpty: false,
        maxMetHabitsInDay: 1,
        monthlyAvg: 4,
        streakDays: 1,
        bestWeekPct: 14,
      }),
      'Primer registro',
    );
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatMonthLabel,
  getMonthMatrix,
  getWeekdayLabels,
  parseIsoDateKey,
  toIsoDateKey,
} from '../../src/features/achievements/calendarUtils';

describe('achievements/calendarUtils', () => {
  it('converts date keys to and from local dates', () => {
    const parsed = parseIsoDateKey('2026-03-15');
    assert.equal(toIsoDateKey(parsed), '2026-03-15');
    assert.equal(parsed.getHours(), 12);
  });

  it('returns weekday labels with optional monday-first order', () => {
    assert.deepEqual(getWeekdayLabels(0), ['D', 'L', 'M', 'X', 'J', 'V', 'S']);
    assert.deepEqual(getWeekdayLabels(1), ['L', 'M', 'X', 'J', 'V', 'S', 'D']);
  });

  it('builds a calendar matrix with leading and trailing days', () => {
    const matrix = getMonthMatrix(2026, 2, 1);

    assert.equal(matrix.length, 6);
    assert.equal(matrix[0][0]?.isoDate, '2026-02-23');
    assert.equal(matrix[0][0]?.inCurrentMonth, false);
    assert.equal(matrix[1][0]?.isoDate, '2026-03-02');
    assert.equal(matrix[1][0]?.inCurrentMonth, true);
    assert.equal(matrix[5][6]?.isoDate, '2026-04-05');
  });

  it('formats month labels in Spanish with capitalized month name', () => {
    assert.equal(formatMonthLabel(new Date(2026, 2, 1, 12, 0, 0, 0)), 'Marzo de 2026');
  });
});

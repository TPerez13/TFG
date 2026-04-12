import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildHabitReminderSnapshot,
  DEFAULT_NOTIFICATION_SETTINGS,
  isValidTimeValue,
  normalizeNotificationSettingsFromPreferences,
} from '../../src/features/notifications/settings';

describe('notifications/settings', () => {
  it('validates time strings using HH:MM format', () => {
    assert.equal(isValidTimeValue('08:30'), true);
    assert.equal(isValidTimeValue(' 22:00 '), true);
    assert.equal(isValidTimeValue('25:00'), false);
    assert.equal(isValidTimeValue('8:30'), false);
  });

  it('builds a reminder snapshot for the selected habit', () => {
    const snapshot = buildHabitReminderSnapshot(DEFAULT_NOTIFICATION_SETTINGS, 'nutricion');

    assert.deepEqual(snapshot, {
      globalEnabled: true,
      quietHoursEnabled: false,
      quietFrom: '22:00',
      quietTo: '07:00',
      habitEnabled: true,
      time: '13:00',
    });
  });

  it('normalizes notification preferences from current and legacy fields', () => {
    const normalized = normalizeNotificationSettingsFromPreferences({
      quiet_hours: {
        desde: '23:00',
        hasta: '06:30',
      },
      nutricion: {
        recordatoriosComidas: false,
      },
      notificaciones: {
        enabled: false,
        summaryTime: '09:15',
        habits: {
          hidratacion: {
            enabled: false,
            time: '11:00',
          },
        },
      },
    });

    assert.deepEqual(normalized.global, {
      enabled: false,
      summaryTime: '09:15',
      quietHoursEnabled: false,
      quietFrom: '23:00',
      quietTo: '06:30',
    });
    assert.deepEqual(normalized.habits.hidratacion, {
      enabled: false,
      time: '11:00',
    });
    assert.equal(normalized.habits.nutricion.enabled, false);
    assert.equal(normalized.habits.ejercicio.time, '20:00');
  });

  it('falls back to defaults when preferences are invalid', () => {
    assert.deepEqual(
      normalizeNotificationSettingsFromPreferences('invalid'),
      DEFAULT_NOTIFICATION_SETTINGS
    );
  });
});

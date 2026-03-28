import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  defaultPrivacyPreferences,
  hasCompletePrivacyPreferences,
  mergePreferences,
  normalizePrivacyPreferences,
} from '../../src/features/users/preferences';

describe('users/preferences', () => {
  it('returns default privacy preferences for invalid values', () => {
    assert.deepEqual(normalizePrivacyPreferences(null), defaultPrivacyPreferences);
    assert.deepEqual(normalizePrivacyPreferences('invalid'), defaultPrivacyPreferences);
  });

  it('supports both current and legacy preference keys', () => {
    assert.deepEqual(
      normalizePrivacyPreferences({
        permitirAnalitica: false,
        personalizacion: false,
        mostrarContenidoEnPantallaBloqueada: true,
      }),
      {
        analyticsEnabled: false,
        personalizationEnabled: false,
        lockScreenContent: true,
      }
    );
  });

  it('detects whether a privacy block can be normalized from an object', () => {
    assert.equal(hasCompletePrivacyPreferences({ analyticsEnabled: true }), true);
    assert.equal(hasCompletePrivacyPreferences(undefined), false);
  });

  it('merges nested privacy preferences without losing unrelated keys', () => {
    const result = mergePreferences(
      {
        perfil: { avatarId: 'sprout' },
        privacidad: {
          analyticsEnabled: true,
          personalizationEnabled: true,
        },
      },
      {
        privacidad: {
          lockScreenContent: true,
          personalizationEnabled: false,
        },
      }
    );

    assert.deepEqual(result, {
      perfil: { avatarId: 'sprout' },
      privacidad: {
        analyticsEnabled: true,
        personalizationEnabled: false,
        lockScreenContent: true,
      },
    });
  });
});

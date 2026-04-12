import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildForgotPasswordRequestSuccess,
  getForgotPasswordFormMeta,
  requestForgotPasswordCode,
  sanitizeForgotPasswordCode,
} from '../../src/features/auth/forgotPasswordFlow';
import { jsonResponse } from '../helpers/http';

describe('forgotPasswordFlow', () => {
  it('keeps the recovery flow in two steps and reveals reset fields after requesting the code', async () => {
    const initialMeta = getForgotPasswordFormMeta({
      step: 'request',
      correo: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
      loading: false,
      resetDone: false,
    });

    const message = await requestForgotPasswordCode(
      'ana@example.com',
      async () =>
        jsonResponse({
          message: 'Si el correo existe, enviamos instrucciones para restablecer la contraseña.',
        })
    );
    const nextState = buildForgotPasswordRequestSuccess(message);
    const resetMeta = getForgotPasswordFormMeta({
      step: nextState.step,
      correo: 'ana@example.com',
      code: nextState.code,
      newPassword: nextState.newPassword,
      confirmPassword: nextState.confirmPassword,
      loading: false,
      resetDone: nextState.resetDone,
    });

    assert.equal(initialMeta.visibleFieldCount, 1);
    assert.equal(initialMeta.primaryButtonTitle, 'Solicitar código');
    assert.equal(resetMeta.visibleFieldCount, 4);
    assert.equal(resetMeta.primaryButtonTitle, 'Restablecer contraseña');
    assert.equal(nextState.info, 'Si el correo existe, enviamos instrucciones para restablecer la contraseña.');
  });

  it('sanitizes recovery codes to six digits', () => {
    assert.equal(sanitizeForgotPasswordCode('12ab34cd567'), '123456');
  });
});

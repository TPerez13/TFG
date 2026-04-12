import type { ForgotPasswordResponse, ResetPasswordResponse } from '@muchasvidas/shared';
import { apiFetch } from '../../services/api';

export type ForgotPasswordStep = 'request' | 'reset';

type ForgotPasswordFetcher = typeof apiFetch;

type ForgotPasswordFormMetaInput = {
  step: ForgotPasswordStep;
  correo: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  resetDone: boolean;
};

type ForgotPasswordMessagePayload = {
  message?: string;
};

export type ForgotPasswordFormMeta = {
  visibleFieldCount: number;
  primaryButtonTitle: string;
  backButtonTitle: string;
  canRequestCode: boolean;
  canReset: boolean;
};

export const DEFAULT_REQUEST_SUCCESS_MESSAGE =
  'Si el correo existe, te enviaremos un código de 6 dígitos por correo. Revisa tu bandeja de entrada.';
export const DEFAULT_RESET_SUCCESS_MESSAGE = 'Contraseña restablecida correctamente.';

const parseResponseMessage = async (response: Response): Promise<string | null> => {
  try {
    const payload = (await response.json()) as ForgotPasswordMessagePayload | null;
    return payload?.message ?? null;
  } catch {
    return null;
  }
};

export const sanitizeForgotPasswordCode = (value: string): string =>
  value.replace(/\D/g, '').slice(0, 6);

export const getForgotPasswordFormMeta = (
  input: ForgotPasswordFormMetaInput
): ForgotPasswordFormMeta => {
  const normalizedCorreo = input.correo.trim();
  const normalizedCode = input.code.trim();

  return {
    visibleFieldCount: input.step === 'request' ? 1 : 4,
    primaryButtonTitle:
      input.step === 'request'
        ? input.loading
          ? 'Solicitando...'
          : 'Solicitar código'
        : input.loading
        ? 'Restableciendo...'
        : 'Restablecer contraseña',
    backButtonTitle: input.resetDone ? 'Ir a Iniciar sesión' : 'Volver a Iniciar sesión',
    canRequestCode: normalizedCorreo.length > 0 && !input.loading,
    canReset:
      normalizedCorreo.length > 0 &&
      normalizedCode.length === 6 &&
      input.newPassword.length > 0 &&
      input.confirmPassword.length > 0 &&
      !input.loading,
  };
};

export const buildForgotPasswordRequestSuccess = (message?: string) => ({
  step: 'reset' as const,
  code: '',
  newPassword: '',
  confirmPassword: '',
  info: message ?? DEFAULT_REQUEST_SUCCESS_MESSAGE,
  resetDone: false,
});

export const buildForgotPasswordResetSuccess = (message?: string) => ({
  code: '',
  newPassword: '',
  confirmPassword: '',
  info: message ?? DEFAULT_RESET_SUCCESS_MESSAGE,
  resetDone: true,
});

export async function requestForgotPasswordCode(
  correo: string,
  fetcher: ForgotPasswordFetcher = apiFetch
): Promise<string> {
  const response = await fetcher('/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ correo }),
  });

  const message = (await parseResponseMessage(response)) as ForgotPasswordResponse['message'] | null;
  if (!response.ok) {
    throw new Error(message ?? 'No se pudo solicitar el código de recuperación.');
  }

  return message ?? DEFAULT_REQUEST_SUCCESS_MESSAGE;
}

export async function resetForgotPassword(
  payload: {
    correo: string;
    code: string;
    newPassword: string;
  },
  fetcher: ForgotPasswordFetcher = apiFetch
): Promise<string> {
  const response = await fetcher('/password/reset', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const message = (await parseResponseMessage(response)) as ResetPasswordResponse['message'] | null;
  if (!response.ok) {
    throw new Error(message ?? 'No se pudo restablecer la contraseña.');
  }

  return message ?? DEFAULT_RESET_SUCCESS_MESSAGE;
}

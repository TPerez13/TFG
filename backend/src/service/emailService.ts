import { config } from "../config";
import { AppError } from "../utils/errors";

const PASSWORD_RESET_SUBJECT = "Recuperación de contraseña - TrackHabit Loop";
const PASSWORD_RESET_EMAIL_UNAVAILABLE_MESSAGE =
  "La recuperación por correo no está disponible en este momento.";
const PASSWORD_RESET_EMAIL_DELIVERY_FAILED_MESSAGE =
  "No se pudo enviar el correo de recuperación. Revisa la configuración de Resend y MAIL_FROM.";
const PASSWORD_RESET_EMAIL_ONBOARDING_LIMITATION_MESSAGE =
  "No se pudo enviar el correo de recuperación. Con onboarding@resend.dev solo puedes enviar al correo propietario de la cuenta de Resend; para destinatarios externos necesitas un dominio verificado y MAIL_FROM con ese dominio.";

type PasswordResetEmailInput = {
  expiresInMinutes: number;
  resetCode: string;
  to: string;
};

export type PasswordResetEmailResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      statusCode: number;
    };

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildPasswordResetText = ({
  expiresInMinutes,
  resetCode,
}: Pick<PasswordResetEmailInput, "expiresInMinutes" | "resetCode">): string =>
  [
    "Has solicitado restablecer la contraseña de tu cuenta de TrackHabit Loop.",
    "",
    `Código temporal: ${resetCode}`,
    `Caduca en ${expiresInMinutes} minutos.`,
    "",
    "Abre la app e introduce este código para definir una nueva contraseña.",
    "Si no has solicitado este cambio, puedes ignorar este correo.",
  ].join("\n");

const buildPasswordResetHtml = ({
  expiresInMinutes,
  resetCode,
}: Pick<PasswordResetEmailInput, "expiresInMinutes" | "resetCode">): string => {
  const safeCode = escapeHtml(resetCode);
  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.5">
      <h2 style="margin-bottom:12px">Recuperación de contraseña</h2>
      <p>Has solicitado restablecer la contraseña de tu cuenta de TrackHabit Loop.</p>
      <p>Introduce este código temporal en la app:</p>
      <div style="margin:20px 0;padding:16px 20px;border-radius:12px;background:#eef6ff;font-size:28px;font-weight:700;letter-spacing:6px;text-align:center">
        ${safeCode}
      </div>
      <p>Caduca en <strong>${expiresInMinutes} minutos</strong>.</p>
      <p>Si no has solicitado este cambio, puedes ignorar este correo.</p>
    </div>
  `.trim();
};

const usesResendOnboardingSender = (): boolean =>
  config.mail.provider === "resend" && config.mail.from.toLowerCase() === "onboarding@resend.dev";

export function isPasswordResetEmailConfigured(): boolean {
  const mailConfig = config.mail;
  if (mailConfig.provider === "disabled") {
    return false;
  }

  if (mailConfig.provider === "resend") {
    return Boolean(mailConfig.from && mailConfig.resendApiKey);
  }

  return false;
}

export function assertPasswordResetEmailConfigured(): void {
  if (isPasswordResetEmailConfigured()) {
    return;
  }

  throw new AppError(PASSWORD_RESET_EMAIL_UNAVAILABLE_MESSAGE, 503);
}

async function sendWithResend({
  expiresInMinutes,
  resetCode,
  to,
}: PasswordResetEmailInput): Promise<PasswordResetEmailResult> {
  const mailConfig = config.mail;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mailConfig.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mailConfig.from,
      to: [to],
      subject: PASSWORD_RESET_SUBJECT,
      text: buildPasswordResetText({ expiresInMinutes, resetCode }),
      html: buildPasswordResetHtml({ expiresInMinutes, resetCode }),
    }),
  });

  if (response.ok) {
    return { ok: true };
  }

  const errorBody = await response.text();
  console.error("[mail] Resend password reset delivery failed:", response.status, errorBody);

  return {
    ok: false,
    message: usesResendOnboardingSender()
      ? PASSWORD_RESET_EMAIL_ONBOARDING_LIMITATION_MESSAGE
      : PASSWORD_RESET_EMAIL_DELIVERY_FAILED_MESSAGE,
    statusCode: response.status >= 500 ? 502 : 503,
  };
}

export async function sendPasswordResetEmail(
  input: PasswordResetEmailInput
): Promise<PasswordResetEmailResult> {
  if (!isPasswordResetEmailConfigured()) {
    return {
      ok: false,
      message: PASSWORD_RESET_EMAIL_UNAVAILABLE_MESSAGE,
      statusCode: 503,
    };
  }

  const mailConfig = config.mail;
  try {
    if (mailConfig.provider === "resend") {
      return await sendWithResend(input);
    }
  } catch (error) {
    console.error("[mail] Unexpected password reset delivery error:", error);
  }

  return {
    ok: false,
    message: PASSWORD_RESET_EMAIL_DELIVERY_FAILED_MESSAGE,
    statusCode: 502,
  };
}

import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

const port = Number(process.env.PORT || 3000);
const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET || "change_me";

const normalizeMailProvider = (value: string | undefined): "disabled" | "resend" => {
  if ((value ?? "").trim().toLowerCase() === "resend") {
    return "resend";
  }
  return "disabled";
};

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in the environment.");
}

/**
 * Centralized runtime configuration for the backend.
 */
export const config = {
  port,
  databaseUrl,
  sessionSecret,
  get mail() {
    return {
      provider: normalizeMailProvider(process.env.MAIL_PROVIDER),
      from: (process.env.MAIL_FROM ?? "").trim(),
      resendApiKey: (process.env.RESEND_API_KEY ?? "").trim(),
    };
  },
};

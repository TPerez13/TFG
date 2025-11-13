import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

const port = Number(process.env.PORT || 3000);
const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET || "change_me";

if (!databaseUrl) {
  throw new Error("DATABASE_URL no está definido en el entorno.");
}

export const config = {
  port,
  databaseUrl,
  sessionSecret,
};

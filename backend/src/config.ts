import path from "path";
import dotenv from "dotenv";

//__dirname ruta absoluta del directorio donde se encuentra el archivo que se está ejecutando
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

//Convierte a número el valor de PORT definido en las variables de entorno, y si no existe usa 3000 como valor por defecto
const port = Number(process.env.PORT || 3000);
const databaseUrl = process.env.DATABASE_URL;

//Firmar cookies de sesión (express-session, cookie-session), de modo que el cliente no pueda alterar su contenido; el servidor verifica la firma usando el secreto.
const sessionSecret = process.env.SESSION_SECRET || "change_me";

if (!databaseUrl) {
  throw new Error("DATABASE_URL no está definido en el entorno.");
}

export const config = {
  port,
  databaseUrl,
  sessionSecret,
};

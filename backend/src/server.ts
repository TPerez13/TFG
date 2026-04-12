import os from "os";
import { config } from "./config";
import { verifyConnection } from "./db";
import { createApp } from "./app";

const getLanUrls = (port: number) => {
  const interfaces = os.networkInterfaces();
  const urls = new Set<string>();

  Object.values(interfaces).forEach((networkInterface) => {
    (networkInterface ?? []).forEach((address) => {
      if (address.family === "IPv4" && !address.internal) {
        urls.add(`http://${address.address}:${port}`);
      }
    });
  });

  return [...urls];
};

/**
 * Bootstraps the HTTP server.
 * Loads configuration, verifies the database connection, creates the Express app
 * and starts listening on the configured port.
 */
async function bootstrap() {
  try {
    await verifyConnection();
    console.log("Conexión con PostgreSQL verificada.");
  } catch (error) {
    console.error("No se pudo verificar la conexión con la base de datos:", error);
    process.exit(1);
  }

  const app = createApp();

  app.listen(config.port, config.host, () => {
    console.log(`Servidor escuchando en http://${config.host}:${config.port}`);

    if (config.host === "0.0.0.0") {
      console.log(`Acceso local: http://localhost:${config.port}`);
      getLanUrls(config.port).forEach((url) => {
        console.log(`Acceso LAN: ${url}`);
      });
    }
  });
}

bootstrap();

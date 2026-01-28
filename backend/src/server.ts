import { config } from "./config";
import { verifyConnection } from "./db";
import { createApp } from "./app";

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

  app.listen(config.port, () => {
    console.log(`Servidor escuchando en http://localhost:${config.port}`);
  });
}

bootstrap();

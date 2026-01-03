import { config } from "./config";
import { verifyConnection } from "./db";
import { createApp } from "./app";

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
// bootstrap verifica la conexión a la base de datos y levanta la app configurada en createApp().

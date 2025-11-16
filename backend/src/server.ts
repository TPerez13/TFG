import express from "express";
import cors from "cors";
import { config } from "./config";
import { verifyConnection } from "./db";
import authRouter from "./routes/auth";

async function bootstrap() {
  try {
    await verifyConnection();
    console.log("Conexión con PostgreSQL verificada.");
  } catch (error) {
    console.error("No se pudo verificar la conexión con la base de datos:", error);
    process.exit(1);
  }

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", authRouter);

  app.listen(config.port, () => {
    console.log(`Servidor escuchando en http://localhost:${config.port}`);
  });
}

bootstrap();
 //En resumen: bootstrap arma el servidor; cors() abre el backend a clientes en otros orígenes;
 //express.json() convierte los cuerpos JSON entrantes en objetos utilizables.
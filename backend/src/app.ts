import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import habitsRouter from "./routes/habits";
import usersRouter from "./routes/users";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Endpoint de salud para comprobar disponibilidad.
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Prefijo común para los endpoints públicos/privados de la API.
  app.use("/api", authRouter);
  app.use("/api", usersRouter);
  app.use("/api", habitsRouter);

  // Manejo de errores centralizado al final del pipeline.
  app.use(errorHandler);

  return app;
}

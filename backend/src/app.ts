import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import habitsRouter from "./routes/habits";
import usersRouter from "./routes/users";
import notificationsRouter from "./routes/notifications";
import supportRouter from "./routes/support";
import appInfoRouter from "./routes/appInfo";
import nutritionRouter from "./routes/nutrition";
import { errorHandler } from "./middleware/errorHandler";

/**
 * Application factory.
 * Registers middleware, health check and API routing, and returns the configured app
 * without starting the HTTP server.
 */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use((req, _res, next) => {
    console.log(`[API] ${req.method} ${req.path}`);
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", authRouter);
  app.use("/api", usersRouter);
  app.use("/api", habitsRouter);
  app.use("/api", notificationsRouter);
  app.use("/api", supportRouter);
  app.use("/api", appInfoRouter);
  app.use("/api", nutritionRouter);

  app.use(errorHandler);

  return app;
}

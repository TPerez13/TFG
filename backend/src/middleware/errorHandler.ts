import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

// Middleware centralizado: traduce errores conocidos en respuestas HTTP y loguea el resto.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response | void {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error("Unexpected error:", err);
  return res.status(500).json({ message: "Error interno del servidor." });
}

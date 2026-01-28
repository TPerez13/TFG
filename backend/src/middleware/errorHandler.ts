import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

/**
 * Centralized error middleware.
 * Translates domain errors into HTTP responses and logs unexpected failures.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response | void {
  if (err instanceof AppError) {
    console.error(`[ERROR] ${err.statusCode} - ${err.message}`);
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error("Unexpected error:", err);
  return res.status(500).json({ message: "Error interno del servidor." });
}

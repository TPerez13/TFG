import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { verifyAccessToken } from "../utils/jwt";

/**
 * Express request extended with the authenticated user identifier.
 */
export type AuthRequest = Request & { userId?: number };

/**
 * Authentication middleware.
 * Validates the Bearer token and injects the authenticated userId into the request.
 * It must run before protected routes to authorize access.
 */
export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  console.log("[AUTH] header:", header ?? "none");
  if (!header) {
    next(new AppError("Token requerido.", 401));
    return;
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    next(new AppError("Token invalido.", 401));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    console.log("[AUTH] payload:", payload);
    const userId = Number(payload.sub);
    if (!userId || Number.isNaN(userId)) {
      next(new AppError("Token invalido.", 401));
      return;
    }
    req.userId = userId;
    next();
  } catch (_err) {
    next(new AppError("Token invalido.", 401));
  }
}

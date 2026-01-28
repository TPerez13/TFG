import type { Request, Response, NextFunction } from "express";
import * as authService from "../service/authService";

/**
 * POST /api/login
 * Authenticates a user with credentials and returns a user summary plus token.
 * The request body is expected to contain login data (email/username and password).
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/register
 * Registers a new user and returns the created user summary plus token.
 * The request body is expected to contain registration data and optional preferences.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

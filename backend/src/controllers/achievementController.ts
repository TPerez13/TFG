import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { getAchievementsForUser } from "../services/achievementService";
import { AppError } from "../utils/errors";

export async function listAchievements(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.userId) {
      throw new AppError("Token invalido.", 401);
    }

    const response = await getAchievementsForUser(req.userId);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

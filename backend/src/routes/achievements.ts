import { Router } from "express";
import { listAchievements } from "../controllers/achievementController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/achievements", requireAuth, listAchievements);

export default router;

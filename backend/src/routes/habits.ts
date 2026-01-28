import { Router } from "express";
import { listEntries } from "../controllers/habitController";
import { requireAuth } from "../middleware/auth";

/**
 * Habit data routes.
 * Protected endpoints for retrieving habit entries.
 */
const router = Router();

router.get("/habits/entries", requireAuth, listEntries);

export default router;

import { Router } from "express";
import { createEntry, deleteEntry, listEntries } from "../controllers/habitController";
import { requireAuth } from "../middleware/auth";

/**
 * Habit data routes.
 * Protected endpoints for retrieving habit entries.
 */
const router = Router();

router.get("/habits/entries", requireAuth, listEntries);
router.post("/habits/entries", requireAuth, createEntry);
router.delete("/habits/entries/:id", requireAuth, deleteEntry);

export default router;

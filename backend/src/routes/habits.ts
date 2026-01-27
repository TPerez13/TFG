import { Router } from "express";
import { listEntries } from "../controllers/habitController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/habits/entries", requireAuth, listEntries);

export default router;

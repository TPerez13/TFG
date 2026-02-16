import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createNutritionEntry,
  deleteNutritionEntry,
  listFrequentFoods,
  listRecentFoods,
  nutritionToday,
} from "../controllers/nutritionController";

const router = Router();

router.get("/nutrition/today", requireAuth, nutritionToday);
router.get("/nutrition/recent", requireAuth, listRecentFoods);
router.get("/nutrition/frequent", requireAuth, listFrequentFoods);
router.post("/nutrition/entries", requireAuth, createNutritionEntry);
router.delete("/nutrition/entries/:id", requireAuth, deleteNutritionEntry);

export default router;

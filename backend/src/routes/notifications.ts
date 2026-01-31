import { Router } from "express";
import {
  list,
  getById,
  unreadCount,
  updateRead,
  readAll,
  remove,
  updateSettings,
  seed,
} from "../controllers/notificationController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/notifications", requireAuth, list);
router.get("/notifications/:id", requireAuth, getById);
router.get("/notifications/unread-count", requireAuth, unreadCount);
router.patch("/notifications/:id/read", requireAuth, updateRead);
router.patch("/notifications/read-all", requireAuth, readAll);
router.delete("/notifications/:id", requireAuth, remove);
router.post("/notifications/seed", requireAuth, seed);

export default router;

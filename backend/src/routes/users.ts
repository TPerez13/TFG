import { Router } from "express";
import { getMe, updateMe, exportMe, deleteMe } from "../controllers/userController";
import { requireAuth } from "../middleware/auth";

/**
 * User account routes.
 * Protected endpoints that require a valid access token.
 */
const router = Router();

router.get("/users/me", requireAuth, getMe);
router.put("/users/me", requireAuth, updateMe);
router.get("/users/me/export", requireAuth, exportMe);
router.delete("/users/me", requireAuth, deleteMe);

export default router;

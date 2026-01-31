import { Router } from "express";
import { getMe, updateMe } from "../controllers/userController";
import { requireAuth } from "../middleware/auth";

/**
 * User account routes.
 * Protected endpoints that require a valid access token.
 */
const router = Router();

router.get("/users/me", requireAuth, getMe);
router.put("/users/me", requireAuth, updateMe);

export default router;

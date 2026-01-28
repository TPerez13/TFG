import { Router } from "express";
import { getMe } from "../controllers/userController";
import { requireAuth } from "../middleware/auth";

/**
 * User account routes.
 * Protected endpoints that require a valid access token.
 */
const router = Router();

router.get("/users/me", requireAuth, getMe);

export default router;

import { Router } from "express";
import { getMe } from "../controllers/userController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/users/me", requireAuth, getMe);

export default router;

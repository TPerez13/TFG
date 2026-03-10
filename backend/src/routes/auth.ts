import { Router } from "express";
import * as authController from "../controllers/authController";

/**
 * Authentication routes.
 * Exposes login and registration endpoints under the /api prefix.
 */
const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.post("/register", authController.register);
authRouter.post("/password/forgot", authController.forgotPassword);
authRouter.post("/password/reset", authController.resetPassword);

export default authRouter;

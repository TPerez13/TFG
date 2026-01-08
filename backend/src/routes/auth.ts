import { Router } from "express";
import * as authController from "../controllers/authController";

const authRouter = Router();

// Rutas de autenticacion: se limitan a mapear URL -> controlador.
authRouter.post("/login", authController.login);
authRouter.post("/register", authController.register);

export default authRouter;

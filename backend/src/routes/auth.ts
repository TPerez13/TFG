import { Router } from "express";
import * as authController from "../controllers/authController";

const authRouter = Router();

// Rutas de autenticación: se limitan a mapear URL -> controlador.
authRouter.post("/login", authController.login);

export default authRouter;

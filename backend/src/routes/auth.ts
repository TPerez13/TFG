import { Router } from "express";
import bcrypt from "bcryptjs";
import type { LoginRequest, LoginResponse } from "@muchasvidas/shared";
import { pool } from "../db";

const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { username, password } = (req.body ?? {}) as Partial<LoginRequest>;

  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contraseña son requeridos." });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, password_hash FROM users WHERE username = $1",
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const payload: LoginResponse = {
      message: "Inicio de sesión correcto.",
      user: { id: user.id, username: user.username },
    };

    return res.json(payload);
  } catch (error) {
    console.error("Error durante el login:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

export default authRouter;

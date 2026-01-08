import type { Request, Response, NextFunction } from "express";
import * as authService from "../service/authService";

// Controlador: recibe la petición HTTP y delega en el servicio la lógica de negocio.
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

import { Router } from "express";
import bcrypt from "bcryptjs";
import type { LoginRequest, LoginResponse } from "@muchasvidas/shared";
import { pool } from "../db";

const authRouter = Router();

//router.post(path, handler), handler -> funcion lambda [procesan la petición y envían la respuesta]
authRouter.post("/login", async (req, res) => {
  //operador de coalescencia nula Devuelve el operando de la derecha solo si el de la izquierda es null o undefined
  //le dice al compilador que req.body (o {}) puede tener parte de las propiedades de LoginRequest
  //Partial<T> es un helper de TypeScript que marca todas las propiedades de 
  //T como opcionales. Aquí se usa solo para decirle al compilador “trata el body como algo que podría tener las
  //props de LoginRequest, pero no asumas que estén todas”
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
/*
HTTP: el protocolo de transporte/solicitudes-respuestas
 entre cliente y servidor (métodos como GET/POST, URLs, cabeceras, códigos de estado).
JSON: el formato de texto usado para serializar datos
 en esas peticiones/respuestas (objetos, arrays, strings, números).
DTO: la definición de la forma/contrato de esos datos
 en tu código (tipos/clases “planas” que describen qué campos lleva el JSON).
  JSON viaja por HTTP; los DTOs aseguran que tu app encode/decodifique ese JSON
   con la estructura acordada.
*/
export default authRouter;

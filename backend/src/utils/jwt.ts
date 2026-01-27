import jwt from "jsonwebtoken";
import { config } from "../config";

type TokenPayload = {
  sub: string;
};

export function signAccessToken(userId: number): string {
  const payload: TokenPayload = { sub: String(userId) };
  return jwt.sign(payload, config.sessionSecret, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.sessionSecret) as TokenPayload;
}

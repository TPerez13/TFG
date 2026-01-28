import jwt from "jsonwebtoken";
import { config } from "../config";

type TokenPayload = {
  sub: string;
};

/**
 * Signs a short-lived access token for an authenticated user.
 */
export function signAccessToken(userId: number): string {
  const payload: TokenPayload = { sub: String(userId) };
  return jwt.sign(payload, config.sessionSecret, { expiresIn: "7d" });
}

/**
 * Verifies an access token and returns its payload.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.sessionSecret) as TokenPayload;
}

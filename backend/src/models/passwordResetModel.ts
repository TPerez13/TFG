import { pool } from "../db";

type ConsumePasswordResetTokenResult =
  | "consumed"
  | "expired"
  | "already_used"
  | "not_found";

export async function createPasswordResetToken(
  userId: number,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM password_reset_token WHERE id_usuario = $1", [userId]);
    await client.query(
      `INSERT INTO password_reset_token (id_usuario, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt.toISOString()]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePasswordResetTokensByUserId(userId: number): Promise<void> {
  await pool.query("DELETE FROM password_reset_token WHERE id_usuario = $1", [userId]);
}

export async function consumePasswordResetToken(
  userId: number,
  tokenHash: string,
  now: Date
): Promise<ConsumePasswordResetTokenResult> {
  const result = await pool.query(
    `UPDATE password_reset_token
        SET used_at = now()
      WHERE id_usuario = $1
        AND token_hash = $2
        AND used_at IS NULL
        AND expires_at > $3
      RETURNING id_password_reset`,
    [userId, tokenHash, now.toISOString()]
  );

  if ((result.rowCount ?? 0) > 0) {
    return "consumed";
  }

  const existing = await pool.query<{
    expires_at: Date;
    used_at: Date | null;
  }>(
    `SELECT expires_at, used_at
       FROM password_reset_token
      WHERE id_usuario = $1
        AND token_hash = $2
      LIMIT 1`,
    [userId, tokenHash]
  );

  const row = existing.rows[0];

  if (!row) {
    return "not_found";
  }

  if (row.used_at) {
    return "already_used";
  }

  if (row.expires_at.getTime() <= now.getTime()) {
    return "expired";
  }

  return "not_found";
}

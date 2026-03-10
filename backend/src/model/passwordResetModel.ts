import { pool } from "../db";

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

export async function consumePasswordResetToken(
  userId: number,
  tokenHash: string,
  now: Date
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE password_reset_token
        SET used_at = now()
      WHERE id_usuario = $1
        AND token_hash = $2
        AND used_at IS NULL
        AND expires_at > $3`,
    [userId, tokenHash, now.toISOString()]
  );

  return (result.rowCount ?? 0) > 0;
}

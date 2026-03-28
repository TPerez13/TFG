import assert from "node:assert/strict";
import { AppError } from "../../src/utils/errors";

export async function assertRejectsAppError(
  promise: Promise<unknown>,
  statusCode: number,
  message: string
): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    assertIsAppError(error, statusCode, message);
    return true;
  });
}

export function assertIsAppError(error: unknown, statusCode: number, message: string): void {
  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, statusCode);
  assert.equal(error.message, message);
}

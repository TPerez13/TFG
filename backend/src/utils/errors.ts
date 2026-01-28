/**
 * Application-level error with an HTTP status code.
 * Used to propagate domain errors to the HTTP layer.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

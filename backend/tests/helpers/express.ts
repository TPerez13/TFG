import type { NextFunction, Response } from "express";

type MockResponse<TBody> = Response & {
  body?: TBody;
  statusCode?: number;
};

export function createMockResponse<TBody = unknown>(): MockResponse<TBody> {
  const response: Partial<MockResponse<TBody>> = {};

  response.status = (statusCode: number) => {
    response.statusCode = statusCode;
    return response as Response;
  };

  response.json = (body: TBody) => {
    response.body = body;
    return response as Response;
  };

  return response as MockResponse<TBody>;
}

export function createNextSpy(): { calls: unknown[]; next: NextFunction } {
  const calls: unknown[] = [];
  const next: NextFunction = (error?: unknown) => {
    calls.push(error);
  };

  return { calls, next };
}

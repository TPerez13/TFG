import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Express } from "express";

export async function startTestServer(
  app: Express
): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const server = app.listen(0);
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve test server address.");
  }

  return {
    baseUrl: `http://127.0.0.1:${(address as AddressInfo).port}`,
    close: () => closeServer(server),
  };
}

export async function requestJson<T = unknown>(
  baseUrl: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
    method: string;
    path: string;
  }
): Promise<{ json: T | null; status: number }> {
  const headers = { ...(options.headers ?? {}) };
  const hasBody = options.body !== undefined;

  if (hasBody) {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${options.path}`, {
    method: options.method,
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();

  return {
    status: response.status,
    json: text ? (JSON.parse(text) as T) : null,
  };
}

function closeServer(server: Server): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

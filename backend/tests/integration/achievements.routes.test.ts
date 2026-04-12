import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { createApp } from "../../src/app";
import * as achievementService from "../../src/services/achievementService";
import * as jwtUtils from "../../src/utils/jwt";
import { requestJson, startTestServer } from "../helpers/http";

afterEach(() => {
  mock.restoreAll();
});

beforeEach(() => {
  mock.method(console, "log", () => undefined);
  mock.method(console, "error", () => undefined);
});

describe("achievements routes integration", () => {
  it("GET /api/achievements requires a bearer token", async () => {
    const server = await startTestServer(createApp());

    try {
      const response = await requestJson(server.baseUrl, {
        method: "GET",
        path: "/api/achievements",
      });

      assert.equal(response.status, 401);
      assert.deepEqual(response.json, { message: "Token requerido." });
    } finally {
      await server.close();
    }
  });

  it("GET /api/achievements returns the service payload for the authenticated user", async () => {
    let receivedUserId: number | undefined;

    mock.method(jwtUtils, "verifyAccessToken", () => ({ sub: "9" }));
    mock.method(
      achievementService,
      "getAchievementsForUser",
      async (userId: number) => {
        receivedUserId = userId;
        return {
          achievements: [
            {
              id: "FIRST_ENTRY",
              title: "Primer registro",
              description: "Registra tu primer avance.",
              icon: "sparkles-outline",
              points: 10,
              difficulty: 10,
              sharePriority: 10,
              unlocked: true,
              unlockedAt: "2026-03-01T10:00:00.000Z",
              progress: {
                current: 1,
                target: 1,
              },
            },
          ],
        };
      }
    );

    const server = await startTestServer(createApp());

    try {
      const response = await requestJson(server.baseUrl, {
        method: "GET",
        path: "/api/achievements",
        headers: { authorization: "Bearer valid-token" },
      });

      assert.equal(receivedUserId, 9);
      assert.equal(response.status, 200);
      assert.deepEqual(response.json, {
        achievements: [
          {
            id: "FIRST_ENTRY",
            title: "Primer registro",
            description: "Registra tu primer avance.",
            icon: "sparkles-outline",
            points: 10,
            difficulty: 10,
            sharePriority: 10,
            unlocked: true,
            unlockedAt: "2026-03-01T10:00:00.000Z",
            progress: {
              current: 1,
              target: 1,
            },
          },
        ],
      });
    } finally {
      await server.close();
    }
  });
});

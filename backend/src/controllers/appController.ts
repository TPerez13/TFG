import type { AppInfoResponse } from "@muchasvidas/shared";
import type { Request, Response } from "express";

const getAppVersion = (): string => process.env.APP_VERSION || "0.1.0";
const getAppBuild = (): string => process.env.APP_BUILD || "dev";
const getCommitHash = (): string | null => process.env.COMMIT_HASH || null;
const getEnvironment = (): string => process.env.NODE_ENV || "development";

export function getAppInfo(_req: Request, res: Response): void {
  const response: AppInfoResponse = {
    version: getAppVersion(),
    build: getAppBuild(),
    commitHash: getCommitHash(),
    environment: getEnvironment(),
  };
  res.json(response);
}

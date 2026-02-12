import { Router } from "express";
import { getAppInfo } from "../controllers/appController";

const router = Router();

router.get("/app/info", getAppInfo);

export default router;

import { Router } from "express";
import { config } from "../config.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

export default router;

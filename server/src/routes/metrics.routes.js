import { Router } from "express";
import { getGlobalMetrics, getGlobalDetailedMetrics } from "../controllers/metrics.controller.js";

const router = Router();

router.get("/metrics/global", getGlobalMetrics);
router.get("/metrics/global-detalle", getGlobalDetailedMetrics);

export default router;

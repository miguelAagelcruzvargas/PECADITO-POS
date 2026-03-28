import { Router } from "express";
import {
	getConfig,
	updateConfig,
	testTelegram,
	sendStockAlertNow,
	getAlertLogStats,
	clearAlertLog
} from "../controllers/configuracion.controller.js";

const router = Router();

router.get("/configuraciones/:id_negocio", getConfig);
router.put("/configuraciones/:id_negocio", updateConfig);
router.post("/configuraciones/:id_negocio/test-telegram", testTelegram);
router.post("/configuraciones/:id_negocio/send-stock-alert", sendStockAlertNow);
router.get("/configuraciones/:id_negocio/alert-log", getAlertLogStats);
router.delete("/configuraciones/:id_negocio/alert-log", clearAlertLog);

export default router;

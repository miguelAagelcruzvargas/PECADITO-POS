import { Router } from "express";
import { crear, obtenerValoresid, eliminar } from "../controllers/gastos.controller.js";

const router = Router();

router.post("/gastos", crear);

router.get("/gastos/:id", obtenerValoresid);

router.delete("/gastos/:id", eliminar);

export default router;
import { Router } from "express";
import { getPromociones, crearPromocion, eliminarPromocion } from "../controllers/promociones.controller.js";

const router = Router();

router.get("/promociones/:negocioId", getPromociones);
router.post("/promociones", crearPromocion);
router.delete("/promociones/:id", eliminarPromocion);

export default router;

import { Router } from "express";
import { crear, obtener, obtenerValoresid, eliminar } from "../controllers/proveedores.controller.js";

const router = Router();

router.post("/proveedores", crear);

router.get("/proveedores", obtener);

router.get("/proveedores/:id", obtenerValoresid);

router.delete("/proveedores/:id", eliminar);

export default router;
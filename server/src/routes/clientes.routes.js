import { Router } from "express";
import { crear, obtener, obtenerUno, actualizar, eliminar, obtenerValoresid } from "../controllers/clientes.controller.js";

const router = Router();

router.post("/clientes", crear);

router.get("/clientes", obtener);

router.put("/clientes/:id", actualizar);

router.delete("/clientes/:id", eliminar);

router.get("/clientes/:id", obtenerValoresid);

export default router;
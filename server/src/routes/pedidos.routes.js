import { Router } from "express";
import { crear, obtenerValoresid, eliminar, obtenerValoresdeUnPedido } from "../controllers/pedidos.controller.js";

const router = Router();

router.post("/pedidos", crear);

router.delete("/pedidos/:id", eliminar);

router.get("/pedidos/:id", obtenerValoresid);

router.get("/pedidos-aumento/:id", obtenerValoresdeUnPedido);

export default router;
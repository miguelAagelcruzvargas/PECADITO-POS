import { Router } from "express";
import { crear, obtener, eliminar } from "../controllers/toppings.controller.js";

const router = Router();

router.post("/toppings", crear);
router.get("/toppings/:negocio_id", obtener);
router.delete("/toppings/:id", eliminar);

export default router;

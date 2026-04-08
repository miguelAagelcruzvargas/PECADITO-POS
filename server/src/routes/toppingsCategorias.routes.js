import { Router } from "express";
import { crear, obtener, actualizar, eliminar } from "../controllers/toppingsCategorias.controller.js";

const router = Router();

router.post("/toppings-categorias", crear);
router.get("/toppings-categorias/:negocio_id", obtener);
router.put("/toppings-categorias/:id", actualizar);
router.delete("/toppings-categorias/:id", eliminar);

export default router;

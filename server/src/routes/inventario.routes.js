import { Router } from "express";
import { crear, obtenerValoresid, eliminar, restaurar, actualizar, productosStockBajo, obtenerToppingsFijos } from "../controllers/inventario.controller.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

router.post("/inventario", upload.single("imagen"), crear);
router.get("/inventario/:id", obtenerValoresid);
router.get("/inventario/:id/toppings-fijos", obtenerToppingsFijos);
router.put("/inventario/:id", upload.single("imagen"), actualizar);
router.delete("/inventario/:id", eliminar);

router.patch("/inventario/:id/restaurar", restaurar);

router.get("/alertas/:id", productosStockBajo);

export default router;
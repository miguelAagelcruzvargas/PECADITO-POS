import { Router } from "express";
import { crear, obtener, obtenerUno, actualizar, eliminar } from "../controllers/negocios.controller.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

router.post("/negocio", upload.single("logo"), crear);

router.get("/negocio", obtener);

router.get("/negocio/:id", obtenerUno);

router.put("/negocio/:id", upload.single("logo"), actualizar);

router.delete("/negocio/:id", eliminar);

export default router;
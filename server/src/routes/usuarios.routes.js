import { Router } from "express";
import { crear, obtener, obtenerUno, actualizar, actualizarPerfil, eliminar, login, logout, verifyToken, confirmarContraseña, obtenerValoresid } from "../controllers/usuarios.controller.js";
import { authREquired } from "../middlewares/validateToken.js";

const router = Router();

router.post("/register", crear);

router.post("/login", login);

router.post("/logout", logout);

router.get("/verify", verifyToken);

router.get("/usuario", obtener);

router.get("/usuario/:id", obtenerValoresid);

router.get("/usuario/:id", obtenerUno);

router.put("/usuario/:id", actualizar);

router.patch("/usuario/:id/perfil", actualizarPerfil);

router.delete("/usuario/:id", eliminar);

router.post("/password", confirmarContraseña);


export default router;
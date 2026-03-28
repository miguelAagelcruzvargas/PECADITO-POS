import { Router } from "express";
import { iniciarTurno, cerrarTurno, obtenerTurnosActivos, obtenerReporteTurno, obtenerHistorialTurnos } from "../controllers/turnos.controller.js";

const router = Router();

router.post("/turnos/iniciar", iniciarTurno);
router.post("/turnos/cerrar", cerrarTurno);
router.get("/turnos/activos", obtenerTurnosActivos);
router.get("/turnos/reporte/:id", obtenerReporteTurno);
router.get("/turnos/historial/:negocio_id", obtenerHistorialTurnos);

export default router;

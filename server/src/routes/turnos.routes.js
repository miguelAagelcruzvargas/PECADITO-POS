import { Router } from "express";
import { iniciarTurno, cerrarTurno, extenderTurno, obtenerTurnosActivos, obtenerReporteTurno, obtenerHistorialTurnos, obtenerRendimientoHorasExtra, obtenerCortesDia, guardarAjusteCorte } from "../controllers/turnos.controller.js";

const router = Router();

router.post("/turnos/iniciar", iniciarTurno);
router.post("/turnos/cerrar", cerrarTurno);
router.post("/turnos/extender", extenderTurno);
router.get("/turnos/activos", obtenerTurnosActivos);
router.get("/turnos/reporte/:id", obtenerReporteTurno);
router.get("/turnos/historial/:negocio_id", obtenerHistorialTurnos);
router.get("/turnos/rendimiento/horas-extra", obtenerRendimientoHorasExtra);
router.get("/turnos/cortes-dia/:negocio_id", obtenerCortesDia);
router.post("/turnos/corte-ajuste", guardarAjusteCorte);

export default router;

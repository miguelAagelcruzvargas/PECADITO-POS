import { Router } from "express";
import { 
    crear, 
    obtenerValoresid, 
    crearDetalle, 
    obtenerTopProductosMes, 
    obtenerVentasPorMes, 
    obtenerTotalGeneralVentas, 
    getCantidadProductosVendidos,
    getResumenMensual,
    getReporteAvanzado,
    eliminarVenta
} from "../controllers/ventas.controller.js";

const router = Router();

router.post("/ventas", crear);

router.get("/ventas/:id", obtenerValoresid);

router.post("/ventas-detalles", crearDetalle);

router.get('/top-productos-mes/:id', obtenerTopProductosMes);

router.get('/ventas-por-mes/:id', obtenerVentasPorMes);

router.get('/total-general/:id', obtenerTotalGeneralVentas);

router.get('/productos-vendidos/:id_negocio', getCantidadProductosVendidos);

router.get('/resumen-mensual/:id', getResumenMensual);

router.get('/reporte-avanzado/:id', getReporteAvanzado);

router.delete('/ventas/:id', eliminarVenta);

export default router;
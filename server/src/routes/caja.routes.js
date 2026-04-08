import { Router } from 'express';
import { registrarMovimiento, getMovimientos, getBalance } from '../controllers/caja.controller.js';

const router = Router();

router.post('/caja/movimiento', registrarMovimiento);
router.get('/caja/movimientos/:negocio_id', getMovimientos);
router.get('/caja/balance/:negocio_id', getBalance);

export default router;

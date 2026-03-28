import { Router } from 'express';
import {
  getInsumosByNegocio,
  createInsumo,
  updateInsumo,
  getInsumosStockBajo,
  upsertRecetaProducto,
  getRecetaProducto,
  upsertRecetaTopping,
  getRecetaTopping,
} from '../controllers/insumos.controller.js';

const router = Router();

router.get('/insumos/:negocio_id', getInsumosByNegocio);
router.post('/insumos', createInsumo);
router.put('/insumos/:id', updateInsumo);
router.get('/insumos-alertas/:negocio_id', getInsumosStockBajo);

router.get('/recetas-producto/:producto_id', getRecetaProducto);
router.put('/recetas-producto/:producto_id', upsertRecetaProducto);

router.get('/recetas-topping/:topping_id', getRecetaTopping);
router.put('/recetas-topping/:topping_id', upsertRecetaTopping);

export default router;

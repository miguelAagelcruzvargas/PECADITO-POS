import { Router } from "express";
import { createPedidoDigital, getPedidosDigitales, updateStatusPedidoConUsuario } from "../controllers/pedidos_digitales.controller.js";

const router = Router();

router.post("/pedidos-digitales", (req, res) => {
  createPedidoDigital(req.body, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.get("/pedidos-digitales/:negocio_id", (req, res) => {
  getPedidosDigitales(req.params.negocio_id, { view: req.query?.view }, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

router.patch("/pedidos-digitales/:id", (req, res) => {
  updateStatusPedidoConUsuario(req.params.id, req.body.status, req.body.usuario_id, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

export default router;

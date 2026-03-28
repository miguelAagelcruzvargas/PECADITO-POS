import axios from "./axios";

export const crearPedidoDigital = (pedido) => axios.post("/pedidos-digitales", pedido);
export const obtenerPedidosDigitales = (negocioId, view = "active") => axios.get(`/pedidos-digitales/${negocioId}?view=${view}`);
export const actualizarStatusPedidoDigital = (id, status) => axios.patch(`/pedidos-digitales/${id}`, { status });

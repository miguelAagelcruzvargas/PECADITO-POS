import axios from "./axios.js";

export const CrearPedidoRequest = (data) => axios.post("/pedidos", data);

export const ObtenerValoresPorId = (id) => axios.get(`/pedidos/${id}`);

export const EliminarPedidoRequest = (id) => axios.delete(`/pedidos/${id}`);

export const ObtenerPedidoRequest = (id) => axios.get(`/pedidos-aumento/${id}`);
import axios from "./axios.js";

export const ObtenerInventario = () => axios.get("/inventario");

export const CrearProducto = (data) => axios.post("/inventario", data);

export const ObtenerValoresPorId = (id) => axios.get(`/inventario/${id}`);

export const EliminarProductoRequest = (id) => axios.delete(`/inventario/${id}`);

export const ActualizarProducto = (id, data) => axios.put(`/inventario/${id}`, data);

export const AlertasRequest = (id) => axios.get(`/alertas/${id}`);
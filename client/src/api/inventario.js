import axios from "./axios.js";

export const ObtenerInventario = () => axios.get("/inventario");
export const CrearProducto = (data) => axios.post("/inventario", data);
export const ObtenerValoresPorId = (id) => axios.get(`/inventario/${id}`);
export const EliminarProductoRequest = (id) => axios.delete(`/inventario/${id}`);
export const ActualizarProducto = (id, data) => axios.put(`/inventario/${id}`, data);
export const AlertasRequest = (id) => axios.get(`/alertas/${id}`);

// Promociones Programables (Soporte para 2x1, %, Precios Fijos y Fechas)
export const ObtenerPromocionesRequest = (negocioId) => axios.get(`/promociones/${negocioId}`);
export const CrearPromocionRequest = (data) => axios.post("/promociones", data);
export const EliminarPromocionRequest = (id) => axios.delete(`/promociones/${id}`);
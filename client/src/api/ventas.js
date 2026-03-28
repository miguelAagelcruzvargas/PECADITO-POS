import axios from "./axios.js";

export const CrearVenta = (data) => axios.post("/ventas", data);

export const CrearDetallesVenta = (data) => axios.post("/ventas-detalles", data);

export const ObtenerValoresPorId = (id) => axios.get(`/ventas/${id}`);

export const ObtenerTopProductosMes = (id) => axios.get(`/top-productos-mes/${id}`);

export const ObtenerVentasPorMes = (id) => axios.get(`/ventas-por-mes/${id}`);

export const ObtenerTotalGeneralVentas = (id) => axios.get(`/total-general/${id}`);

export const ObtenerCantidadProductosVendidos = (id_negocio) => axios.get(`/productos-vendidos/${id_negocio}`);

export const ObtenerResumenMensual = (id) => axios.get(`/resumen-mensual/${id}`);
import axios from "./axios.js";

export const ObtenerProveedores = () => axios.get("/proveedores");

export const CrearProveedor = (data) => axios.post("/proveedores", data);

export const ObtenerValoresPorId = (id) => axios.get(`/proveedores/${id}`);

export const EliminarProveedor = (id) => axios.delete(`/proveedores/${id}`);
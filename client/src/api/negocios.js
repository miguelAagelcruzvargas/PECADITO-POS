import axios from "./axios.js";

export const ObtenerNegocios = () => axios.get("/negocio");

export const ObtenerNegocioPorId = (id) => axios.get(`/negocio/${id}`);

export const CrearNegocio = (data) => axios.post("/negocio", data);

export const ActualizarNegocio = (id, data) => axios.put(`/negocio/${id}`, data);

export const EliminarNegocio = (id) => axios.delete(`/negocio/${id}`);
import axios from "./axios.js";

export const CrearGastoRequest = (data) => axios.post("/gastos", data);

export const ObtenerValoresPorId = (id) => axios.get(`/gastos/${id}`);

export const EliminarGasto = (id) => axios.delete(`/gastos/${id}`);
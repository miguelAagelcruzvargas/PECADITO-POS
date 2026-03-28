import axios from "./axios.js";

export const ObtenerClientes = () => axios.get("/clientes");

export const ObtenerClientePorId = (id) => axios.get(`/clientes/${id}`);

export const CrearCliente = (data) => axios.post("/clientes", data);

export const ActualizarCliente = (id, data) => axios.put(`/clientes/${id}`, data);

export const EliminarCliente = (id) => axios.put(`/clientes/${id}`);

export const ObtenerValoresPorId = (id) => axios.get(`/clientes/${id}`);
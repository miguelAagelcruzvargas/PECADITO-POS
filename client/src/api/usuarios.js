import axios from "./axios.js";

export const loginRequest = user => axios.post(`/login`, user);

export const registerRequest = user => axios.post(`/register`, user);

export const verifyTokenRequest = () => axios.get('/verify');

export const logoutRequest = () => axios.post(`/logout`);

export const ObtenerUsuarios = () => axios.get("/usuario");

export const ConfirmacionRequest = user => axios.post(`/password`, user);

export const DeleteRequest = (id) => axios.delete(`/usuario/${id}`);

export const ActualizarUsuario = (id, data) => axios.put(`/usuario/${id}`, data);

export const ActualizarPerfil = (id, data) => axios.patch(`/usuario/${id}/perfil`, data);

export const ObtenerValoresPorId = (id) => axios.get(`/usuario/${id}`);
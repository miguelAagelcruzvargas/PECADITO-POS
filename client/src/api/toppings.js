import axios from "./axios";

export const crearTopping = (topping) => axios.post("/toppings", topping);
export const obtenerToppings = (negocioId) => axios.get(`/toppings/${negocioId}`);
export const eliminarTopping = (id) => axios.delete(`/toppings/${id}`);

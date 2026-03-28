import { createContext, useContext, useState } from "react";
import { 
    CrearCliente,
    ObtenerClientes,
    ObtenerValoresPorId,
    ObtenerClientePorId,
    ActualizarCliente,
    EliminarCliente
 } from "../api/clientes.js";

const clientesContext = createContext();

export const useClientes = () => {
    const context = useContext(clientesContext);

    if (!context) {
        throw new Error("useNegocios must be used within a NegociosProvider");
    }

    return context;
}

export function ClientesProvider({ children }) {

    const [clientes, setClientes] = useState([]);
    const [negocioSeleccionado, setNegocioSeleccionado] = useState(null); 
    
    const getValorid = async () => {
            try {
                const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
                const res = await ObtenerValoresPorId(id);
                if (!Array.isArray(res.data)) {
                    setClientes([res.data]); // Lo metes en un array
                } else {
                    setClientes(res.data); // Ya es una lista
                }
            } catch (error) {
                console.log(error);
                if(error.status === 404){
                    setClientes([]);
                }
            }
        }

    const getClientes = async () => {
        try {
            const res = await ObtenerClientes();
            setClientes(res.data.data);
            console.log(res.data.data);
        } catch (error) {
            console.log(error);
        }
    }

    const crearCliente = async (cliente) => {
        console.log(cliente);
        try {
            const res = await CrearCliente(cliente);
            getValorid();
        } catch (error) {
            console.log(error);
        }
    }

    const eliminarCliente = async (id) => {
        try {
            const res = await EliminarCliente(id);
            console.log(res);
            getValorid();
        } catch (error) {
            console.log(error);
        }
    }

    const getNegocio = async (id) => {
        try {
            const res = await ObtenerNegocioPorId(id);
            setNegocioSeleccionado(res.data);
            return res.data;
        } catch (error) {
            console.log(error);
        }
    }

    const actualizarCliente = async (data) => {
        const id = data.id
        const res = ActualizarCliente(id, data);
        try {
            // Opcional: actualiza el estado si lo estás manejando en contexto
            setClientes((prev) =>
            prev.map((cliente) =>
                cliente.id === id ? { ...cliente, ...data } : cliente
            )
            );
            return res.data;
        } catch (e) {
            return { ok: false, message: e?.response?.data?.message || e.message };
        }
    };

    return (
        <clientesContext.Provider value={{
            clientes,
            negocioSeleccionado,
            getClientes,
            getNegocio,
            crearCliente,
            eliminarCliente,
            actualizarCliente,
            getValorid
        }}>
            {children}
        </clientesContext.Provider>
    );
}
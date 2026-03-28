import { createContext, useContext, useState } from "react";
import { 
    CrearNegocio,
    ObtenerNegocios,
    ObtenerNegocioPorId,
    ActualizarNegocio,
    EliminarNegocio,
 } from "../api/negocios.js";

const negociosContext = createContext();

export const useNegocios = () => {
    const context = useContext(negociosContext);

    if (!context) {
        throw new Error("useNegocios must be used within a NegociosProvider");
    }

    return context;
}

export function NegociosProvider({ children }) {

    const [negocios, setNegocios] = useState([]);
    const [negocioSeleccionado, setNegocioSeleccionado] = useState(null);    

    const getNegocios = async () => {
        try {
            const res = await ObtenerNegocios();
            setNegocios(res.data.data);
        } catch (error) {
            console.log(error);
        }
    }

    const crearNegocio = async (negocio) => {
        try {
            const res = await CrearNegocio(negocio);
            getNegocios();
        } catch (error) {
            console.log(error);
        }
    }

    const eliminarNegocio = async (id) => {
        try {
            const res = await EliminarNegocio(id);
            getNegocios();
        } catch (error) {
            console.log(error);
        }
    }

    const getNegocio = async (id) => {
        try {
            const res = await ObtenerNegocioPorId(id);
            setNegocioSeleccionado(res.data.data);
        } catch (error) {
            console.log(error);
        }
    }

    const actualizarNegocio = async (id, datosActualizados) => {
        try {
            const res = await ActualizarNegocio(id, datosActualizados);

            // Opcional: actualiza el estado si lo estás manejando en contexto
            setNegocios((prev) =>
            prev.map((negocio) =>
                negocio.id === id ? { ...negocio, ...datosActualizados } : negocio
            )
            );
            setNegocioSeleccionado(null);
            return res.data;
        } catch (error) {
            console.error("Error al actualizar el negocio", error);
            throw error;
        }
    };

    const funcionNull = () => {
        try {
            const res = setNegocioSeleccionado(null);
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <negociosContext.Provider value={{
            negocios,
            negocioSeleccionado,
            getNegocios,
            getNegocio,
            crearNegocio,
            eliminarNegocio,
            actualizarNegocio,
            funcionNull
        }}>
            {children}
        </negociosContext.Provider>
    );
}
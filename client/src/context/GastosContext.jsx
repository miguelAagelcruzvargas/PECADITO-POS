import { createContext, useContext, useState } from "react";
import { CrearGastoRequest, ObtenerValoresPorId, EliminarGasto } from "../api/gastos.js";

const gastosContext = createContext();

export const useGastos = () => {
    const context = useContext(gastosContext);

    if (!context) {
        throw new Error("useGastos must be used within a GastosProvider");
    }

    return context;
}

export function GastosProvider({ children }) {

    const [gastos, setGastos] = useState([]);

    const getValorid = async () => {
        try {
            const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
            const usuario = JSON.parse(localStorage.getItem("usuario"));
            const res = await ObtenerValoresPorId(!id ? usuario.negocios_id : id);
            if (!Array.isArray(res.data)) {
                setGastos([res.data]); 
            } else {
                setGastos(res.data); 
            }
        } catch (error) {
            if(error.status === 404){
                setGastos([]);
            }
        }
    }

    const crearGasto = async (gasto) => {
        try {
            const res = await CrearGastoRequest(gasto);
            getValorid();
        } catch (error) {
            console.log(error);
        }
    }

    const eliminarGasto = async (id) => {
        try {
            await EliminarGasto(id);
            setGastos(prev => prev.filter(g => g.id !== id));
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <gastosContext.Provider value={{
            gastos,
            crearGasto,
            eliminarGasto,
            getValorid
        }}>
            {children}
        </gastosContext.Provider>
    );
}
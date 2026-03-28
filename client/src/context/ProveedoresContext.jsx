import { createContext, useContext, useState } from "react";
import { 
    CrearProveedor,
    ObtenerValoresPorId,
    EliminarProveedor
 } from "../api/proveedores.js";

const proveedoresContext = createContext();

export const useProveedores = () => {
    const context = useContext(proveedoresContext);

    if (!context) {
        throw new Error("useNegocios must be used within a NegociosProvider");
    }

    return context;
}

export function ProveedoresProvider({ children }) {

    const [proveedores, setProveedores] = useState([]);
    
    const getValorid = async () => {
            try {
                const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
                const usuario = JSON.parse(localStorage.getItem("usuario"));
                const res = await ObtenerValoresPorId(!id ? usuario.negocios_id : id);
                if (!Array.isArray(res.data)) {
                    setProveedores([res.data]); // Lo metes en un array
                } else {
                    setProveedores(res.data); // Ya es una lista
                }
            } catch (error) {
                console.log(error);
                if (error?.response?.status === 404) {
                    setProveedores([]);
                    return;
                }
                setProveedores([]);
            }
        }

    const crearProveedor = async (proveedor) => {
        try {
            const res = await CrearProveedor(proveedor);
            getValorid();
        } catch (error) {
            console.log(error);
        }
    }

    const eliminarProveedor = async (id) => {
        try {
            await EliminarProveedor(id);
            setProveedores(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <proveedoresContext.Provider value={{
            proveedores,
            crearProveedor,
            eliminarProveedor,
            getValorid
        }}>
            {children}
        </proveedoresContext.Provider>
    );
}
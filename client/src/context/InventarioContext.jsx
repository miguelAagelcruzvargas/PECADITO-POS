import { createContext, useContext, useEffect, useState } from "react";
import { CrearProducto, ObtenerValoresPorId, EliminarProductoRequest, AlertasRequest, ActualizarProducto } from "../api/inventario.js";

const inventarioContext = createContext();

export const useInventario = () => {
    const context = useContext(inventarioContext);

    if (!context) {
        throw new Error("useInventario must be used within a InventarioProvider");
    }

    return context;
}

export function InventarioProvider({ children }) {

    const [inventario, setInventario] = useState([]);
    const [alertas, setAlertas] = useState([]);

    const getValorid = async (negocioIdParam) => {
        try {
                const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
                const usuario = JSON.parse(localStorage.getItem("usuario"));
                const negocioId = negocioIdParam || id || usuario?.negocios_id;
                if (!negocioId) {
                    setInventario([]);
                    return;
                }
                const res = await ObtenerValoresPorId(negocioId);
                if (!Array.isArray(res.data)) {
                    setInventario([res.data]); // Lo metes en un array
                } else {
                    setInventario(res.data); // Ya es una lista
                }
            } catch (error) {
                if(error.status === 404){
                    setInventario([]);
                }
            }
    }

    const getAlertasId = async () => {
        try {
                const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
                const usuario = JSON.parse(localStorage.getItem("usuario"));
                const res = await AlertasRequest(!id ? usuario.negocios_id : id);
                if (!Array.isArray(res.data)) {
                    setAlertas([res.data]); // Lo metes en un array
                } else {
                    setAlertas(res.data); // Ya es una lista
                }
            } catch (error) {
                if(error.status === 404){
                    setAlertas([]);
                }
            }
    }

    const Crear = async (negocio) => {
        try {
            const res = await CrearProducto(negocio);
            getValorid();
        } catch (error) {
            console.log(error);
        }
    }

    const eliminarProducto = async (id) => {
            try {
                const res = await EliminarProductoRequest(id);
                getValorid();
            } catch (error) {
                console.log(error);
            }
    }

    const Actualizar = async (id, data) => {
        try {
            await ActualizarProducto(id, data);
            getValorid();
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <inventarioContext.Provider value={{
            inventario,
            alertas,
            Crear,
            getValorid,
            eliminarProducto,
            Actualizar,
            getAlertasId
        }}>
            {children}
        </inventarioContext.Provider>
    );
}
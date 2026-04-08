import { createContext, useContext, useEffect, useState } from "react";
import { 
    CrearProducto, 
    ObtenerValoresPorId, 
    EliminarProductoRequest, 
    AlertasRequest, 
    ActualizarProducto,
    ObtenerPromocionesRequest,
    CrearPromocionRequest,
    EliminarPromocionRequest
} from "../api/inventario.js";

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
    const [promociones, setPromociones] = useState([]);

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
                    setInventario([res.data]); 
                } else {
                    setInventario(res.data);
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
                    setAlertas([res.data]); 
                } else {
                    setAlertas(res.data); 
                }
            } catch (error) {
                if(error.status === 404){
                    setAlertas([]);
                }
            }
    }

    const getPromociones = async (negocioIdParam) => {
        try {
            const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
            const usuario = JSON.parse(localStorage.getItem("usuario"));
            const negocioId = negocioIdParam || id || usuario?.negocios_id;
            if (!negocioId) return;
            const res = await ObtenerPromocionesRequest(negocioId);
            setPromociones(res.data || []);
        } catch (error) {
            console.log(error);
            setPromociones([]);
        }
    }

    const crearPromocion = async (data) => {
        try {
            await CrearPromocionRequest(data);
            getPromociones();
        } catch (error) {
            console.log(error);
        }
    }

    const eliminarPromocion = async (id) => {
        try {
            await EliminarPromocionRequest(id);
            getPromociones();
        } catch (error) {
            console.log(error);
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
            promociones,
            Crear,
            getValorid,
            eliminarProducto,
            Actualizar,
            getAlertasId,
            getPromociones,
            crearPromocion,
            eliminarPromocion
        }}>
            {children}
        </inventarioContext.Provider>
    );
}
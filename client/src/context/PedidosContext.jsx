import { createContext, useContext, useState } from "react";
import { CrearPedidoRequest, ObtenerValoresPorId, EliminarPedidoRequest, ObtenerPedidoRequest } from "../api/pedidos.js";

const pedidosContext = createContext();

export const usePedidos = () => {
    const context = useContext(pedidosContext);

    if (!context) {
        throw new Error("usePedidos must be used within a PedidosProvider");
    }

    return context;
}

export function PedidosProvider({ children }) {

    const [pedidos, setPedidos] = useState([]);

    const getValorid = async () => {
        try {
            const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
            const usuario = JSON.parse(localStorage.getItem("usuario"));
            const res = await ObtenerValoresPorId(!id ? usuario.negocios_id : id);
            if (!Array.isArray(res.data)) {
                setPedidos([res.data]); // Lo metes en un array
            } else {
                setPedidos(res.data); // Ya es una lista
            }
        } catch (error) {
            if(error.status === 404){
                setPedidos([]);
            }
        }
    }

    const crearPedido = async (pedido) => {
        try {
            const res = await CrearPedidoRequest(pedido);
            getValorid();
        } catch (error) {
            console.log(error);
        }
    }

    const eliminarPedido = async (id) => {
            try {
                const res = await EliminarPedidoRequest(id);
                getValorid();
            } catch (error) {
                console.log(error);
            }
        }

    const getProductoAumento = async (id) => {
        try {
            const res = await ObtenerPedidoRequest(id);
            getValorid();
        } catch (error) {
        console.error("Error al obtener el producto:", error);
        return null;
        }
    };

    return (
        <pedidosContext.Provider value={{
            pedidos,
            crearPedido,
            getValorid,
            eliminarPedido,
            getProductoAumento
        }}>
            {children}
        </pedidosContext.Provider>
    );
}
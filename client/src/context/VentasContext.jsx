import { createContext, useContext, useEffect, useState } from "react";
import { 
    CrearVenta, 
    ObtenerValoresPorId, 
    CrearDetallesVenta, 
    ObtenerTopProductosMes, 
    ObtenerVentasPorMes, 
    ObtenerTotalGeneralVentas, 
    ObtenerCantidadProductosVendidos,
    ObtenerResumenMensual
} from "../api/ventas.js";

const ventasContext = createContext();

export const useVentas = () => {
    const context = useContext(ventasContext);

    if (!context) {
        throw new Error("useVentas must be used within a VentasProvider");
    }

    return context;
}

export function VentasProvider({ children }) {

    const [ventas, setVentas] = useState([]);
    const [masvendidos, setMasVendidos] = useState([]);
    const [graficaDashboards, setGraficaDashboards] = useState([]);
    const [totalGeneral, setTotalGeneral] = useState(0);
    const [cantidadProductosVendidos, setCantidadProductosVendidos] = useState([]);
    const [resumenMensual, setResumenMensual] = useState([]);

    const getValorid = async () => {
        try {
            const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
            const usuario = JSON.parse(localStorage.getItem("usuario"));
            const res = await ObtenerValoresPorId(!id ? usuario.negocios_id : id);
            if (!Array.isArray(res.data)) {
                setVentas([res.data]);
            } else {
                setVentas(res.data);
            }
        } catch (error) {
            console.log(error);
            if(error.status === 404){
                setVentas([]);
            }
        }
    }

    const Crear = async (datosCompletos, venta) => {
        try {
            const usuario = JSON.parse(localStorage.getItem("usuario"));
            const payloadVenta = {
                ...datosCompletos,
                usuario_id: usuario?.id || null,
                usuario_nombre: usuario?.nombre || 'Admin',
                canal_venta: 'Local'
            };

            const res = await CrearVenta(payloadVenta);
            const idVenta = res.data.insertId;
            const detalleGenerado = venta.productos.map(item => ({
                ...item,
                venta_id: idVenta,
            }))
            await CrearDetallesVenta(detalleGenerado);
            await getValorid();
            return { ok: true, idVenta };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    const getTopProductosMes = async () => {
        try {
            const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
            const res = await ObtenerTopProductosMes(id);
            if (!Array.isArray(res.data)) {
                setMasVendidos([res.data]);
            } else {
                setMasVendidos(res.data);
            }
        } catch (error) {
            console.log(error);
            if(error.status === 404){
                setMasVendidos([]);
            }
        }
    }

    const getGraficaDashboards = async () => {
        try {
            const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
            const res = await ObtenerVentasPorMes(id);
            if (!Array.isArray(res.data)) {
                setGraficaDashboards([res.data]);
            } else {
                setGraficaDashboards(res.data);
            }
        } catch (error) {
            console.log(error);
            if(error.status === 404){
                setGraficaDashboards([]);
            }
        }
    }

    const getTotalGeneral = async () => {
        try {
            const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
            const res = await ObtenerTotalGeneralVentas(id);
            setTotalGeneral(res.data.total_general);
        } catch (error) {
            console.log(error);
        }
    }

    const getCantidadProductosVendidos = async () => {
        try {
            const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
            const res = await ObtenerCantidadProductosVendidos(id);
            if (!Array.isArray(res.data)) {
                setCantidadProductosVendidos([res.data]);
            } else {
                setCantidadProductosVendidos(res.data);
            }
        } catch (error) {
            console.log(error);
            if (error.status === 404) {
                setCantidadProductosVendidos([]);
            }
        }
    }

    const getResumenMensual = async () => {
        try {
            const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
            const res = await ObtenerResumenMensual(id);
            if (!Array.isArray(res.data)) {
                setResumenMensual([res.data]);
            } else {
                setResumenMensual(res.data);
            }
        } catch (error) {
            console.log(error);
            if (error.status === 404) {
                setResumenMensual([]);
            }
        }
    }

    return (
        <ventasContext.Provider value={{
            ventas,
            masvendidos,
            graficaDashboards,
            totalGeneral,
            cantidadProductosVendidos,
            resumenMensual,
            Crear,
            getValorid,
            getTopProductosMes,
            getGraficaDashboards,
            getTotalGeneral,
            getCantidadProductosVendidos,
            getResumenMensual
        }}>
            {children}
        </ventasContext.Provider>
    );
}
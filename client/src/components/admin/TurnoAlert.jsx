import { useTurno } from "../../context/TurnoContext";
import { Link, useLocation } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";

export default function TurnoAlert() {
    const { turnoActual } = useTurno();
    const location = useLocation();

    // Solo mostrar si NO hay turno y estamos en áreas de cobro/caja
    const areasCobro = ["/ventas", "/gestion-caja"];
    const mostrarAlerta = !turnoActual && areasCobro.includes(location.pathname);

    if (!mostrarAlerta) return null;

    return (
        <Link 
            to="/gestion-caja"
            className="flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl border border-amber-200 hover:bg-amber-100 transition-all shadow-sm animate-pulse"
            title="No tienes un turno activo. Abre caja para registrar tus ventas correctamente."
        >
            <FaExclamationTriangle className="text-sm" />
            <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:inline">Sin Turno Activo</span>
            <span className="text-[10px] font-black uppercase tracking-tighter sm:hidden">Caja Cerrada</span>
        </Link>
    );
}

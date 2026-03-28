import { useState, useEffect } from "react";
import { FaBuilding, FaSearch, FaPlus, FaSignOutAlt, FaExclamationTriangle, FaCashRegister, FaClock } from "react-icons/fa";
import { useNegocios } from "../../context/NegociosContext";
import { useAuth } from "../../context/UsuariosContext";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../api/axios";

function Dashboard() {
    const [busqueda, setBusqueda] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [metrics, setMetrics] = useState([]);
    const [turnosActivos, setTurnosActivos] = useState([]);
    
    const { negocios, getNegocios, crearNegocio } = useNegocios();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, reset } = useForm();

    const fetchMetrics = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/metrics/global', { credentials: 'include' });
            if (!res.ok) throw new Error("Fetch error");
            const data = await res.json();
            setMetrics(data);
        } catch (e) {
            console.error("Error fetching metrics:", e);
        }
    };

    const fetchTurnosActivos = async () => {
        try {
            const res = await axios.get('/turnos/activos');
            setTurnosActivos(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error('Error fetching active shifts:', e);
            setTurnosActivos([]);
        }
    };

    useEffect(() => {
        getNegocios();
        fetchMetrics();
        fetchTurnosActivos();

        const interval = setInterval(fetchTurnosActivos, 10000);
        return () => clearInterval(interval);
    }, []);

    const negociosFiltrados = (Array.isArray(negocios) ? negocios : []).filter((negocio) =>
        negocio.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const onSubmit = handleSubmit((data) => {
        crearNegocio(data);
        setShowModal(false);
        reset();
    });

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const getMetric = (id) => (Array.isArray(metrics) && metrics.find(m => m.id === id)) || {};
    const getTurnosByNegocio = (idNegocio) => turnosActivos.filter((t) => Number(t.negocios_id) === Number(idNegocio));

        const totalVentasHoyGlobal = (metrics || []).reduce((acc, m) => acc + Number(m.ventas_hoy || 0), 0);
        const totalPedidosPendientesGlobal = (metrics || []).reduce((acc, m) => acc + Number(m.pedidos_pendientes || 0), 0);
        const totalStockBajoGlobal = (metrics || []).reduce((acc, m) => acc + Number(m.stock_bajo || 0), 0);
        const sucursalesConTurno = new Set((turnosActivos || []).map((t) => Number(t.negocios_id))).size;

        const topVentasHoy = [...(metrics || [])]
            .sort((a, b) => Number(b.ventas_hoy || 0) - Number(a.ventas_hoy || 0))
            .slice(0, 4);

        const sucursalesConAlerta = [...(metrics || [])]
            .filter((m) => Number(m.stock_bajo || 0) > 0 || Number(m.pedidos_pendientes || 0) > 0)
            .sort((a, b) => (Number(b.stock_bajo || 0) + Number(b.pedidos_pendientes || 0)) - (Number(a.stock_bajo || 0) + Number(a.pedidos_pendientes || 0)))
            .slice(0, 4);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header Limpio y Profesional */}
            <nav className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <img src="/img/logo.png" alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" onError={(e) => e.target.style.display='none'} />
                    <div>
                        <h1 className="text-lg md:text-xl font-black text-pink-600 tracking-tighter leading-none">PECADITO</h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Administrador Central</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-5">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-gray-800 truncate max-w-[120px] md:max-w-[180px]">{user?.nombre || "Admin"}</p>
                        <p className="text-[10px] text-pink-500 font-bold uppercase tracking-wider">Panel Global</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 p-2 md:p-2.5 rounded-lg transition-colors border border-gray-200"
                        title="Cerrar Sesión"
                    >
                        <FaSignOutAlt />
                    </button>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-12">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-6 md:mb-10">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">Mis Sucursales</h2>
                        <p className="text-gray-500 font-medium text-sm md:text-base">Gestiona todos tus puntos de venta desde un solo lugar.</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Link
                            to="/panel-global-detalle"
                            className="bg-gray-900 hover:bg-sky-700 text-white px-4 md:px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <FaCashRegister /> Panel Detallado
                        </Link>
                        <div className="relative flex-1 md:w-80">
                            <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-300" />
                            <input
                                type="text"
                                placeholder="Buscar sucursal..."
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-pink-500 transition-all font-semibold text-gray-700 shadow-sm text-sm"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 md:px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 transition-all flex items-center gap-2"
                        >
                            <FaPlus /> <span className="hidden sm:inline">Nueva</span>
                        </button>
                    </div>
                </header>

                <section className="mb-6 md:mb-10 space-y-4 md:space-y-5">
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Ventas Hoy Global</p>
                            <p className="text-2xl font-black text-emerald-700 mt-1">${totalVentasHoyGlobal.toFixed(2)}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-pink-100 p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-pink-600">Pedidos Pendientes</p>
                            <p className="text-2xl font-black text-pink-600 mt-1">{totalPedidosPendientesGlobal}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Stock Bajo Global</p>
                            <p className="text-2xl font-black text-amber-700 mt-1">{totalStockBajoGlobal}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-sky-700">Sucursales con Caja Activa</p>
                            <p className="text-2xl font-black text-sky-700 mt-1">{sucursalesConTurno}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <FaCashRegister className="text-emerald-600" />
                                <h3 className="text-sm md:text-base font-black text-gray-800">Top Sucursales por Venta Hoy</h3>
                            </div>
                            <div className="space-y-2">
                                {topVentasHoy.length === 0 ? (
                                    <p className="text-sm text-gray-400">Aún no hay datos de ventas hoy.</p>
                                ) : topVentasHoy.map((m) => (
                                    <div key={`top-${m.id}`} className="flex items-center justify-between rounded-xl bg-emerald-50/60 border border-emerald-100 px-3 py-2.5">
                                        <div>
                                            <p className="text-sm font-black text-gray-800">{m.nombre}</p>
                                            <p className="text-[11px] text-gray-500 font-semibold">{getTurnosByNegocio(m.id).length} en turno</p>
                                        </div>
                                        <p className="text-base font-black text-emerald-700">${Number(m.ventas_hoy || 0).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <FaExclamationTriangle className="text-amber-600" />
                                <h3 className="text-sm md:text-base font-black text-gray-800">Atención Rápida por Sucursal</h3>
                            </div>
                            <div className="space-y-2">
                                {sucursalesConAlerta.length === 0 ? (
                                    <p className="text-sm text-gray-400">Sin alertas urgentes en este momento.</p>
                                ) : sucursalesConAlerta.map((m) => (
                                    <div key={`alert-${m.id}`} className="rounded-xl bg-rose-50/50 border border-rose-100 px-3 py-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-black text-gray-800">{m.nombre}</p>
                                            <span className="text-[11px] font-black text-rose-600 uppercase">Prioridad</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1.5 text-[11px] font-semibold text-gray-600">
                                            <span className="inline-flex items-center gap-1"><FaClock className="text-pink-500" /> {Number(m.pedidos_pendientes || 0)} pedidos</span>
                                            <span className="inline-flex items-center gap-1"><FaExclamationTriangle className="text-amber-500" /> {Number(m.stock_bajo || 0)} stock bajo</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {negociosFiltrados.map((negocio) => {
                        const m = getMetric(negocio.id);
                        return (
                            <div key={negocio.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:border-pink-100 rounded-[1.75rem] p-5 md:p-6 transition-all flex flex-col justify-between group">
                                <div>
                                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 text-lg md:text-xl group-hover:bg-pink-600 group-hover:text-white transition-all duration-300">
                                            <FaBuilding />
                                        </div>
                                        <div>
                                            <h3 className="text-base md:text-lg font-black text-gray-800 tracking-tight group-hover:text-pink-600 transition-colors uppercase line-clamp-1">{negocio.nombre}</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">📍 {negocio.ubicacion}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-4 md:mb-6">
                                        <div className="bg-gray-50 p-3 md:p-4 rounded-2xl border border-gray-100">
                                            <p className="text-[9px] text-green-600 font-bold uppercase mb-1 tracking-wider">Ventas Hoy</p>
                                            <p className="text-lg md:text-xl font-black text-gray-900">${m.ventas_hoy || 0}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 md:p-4 rounded-2xl border border-gray-100">
                                            <p className="text-[9px] text-pink-600 font-bold uppercase mb-1 tracking-wider">Pedidos P.</p>
                                            <p className="text-lg md:text-xl font-black text-gray-900">{m.pedidos_pendientes || 0}</p>
                                        </div>
                                    </div>

                                    <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-2xl border border-emerald-100 bg-emerald-50/60">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">En turno / caja ahora</p>
                                        {getTurnosByNegocio(negocio.id).length === 0 ? (
                                            <p className="text-xs text-gray-500 font-semibold">Sin personal en caja en este momento.</p>
                                        ) : (
                                            <div className="space-y-1">
                                                {getTurnosByNegocio(negocio.id).map((t) => (
                                                    <div key={t.id} className="text-xs font-bold text-emerald-800 flex items-center justify-between gap-2">
                                                        <span>{t.nombre_usuario}</span>
                                                        <span className="text-[10px] text-emerald-600">desde {new Date(t.inicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {m.stock_bajo > 0 && (
                                        <div className="bg-rose-50 text-rose-600 text-[10px] font-bold uppercase py-2 px-4 rounded-xl flex items-center gap-2 mb-6 border border-rose-100">
                                            ⚠️ {m.stock_bajo} Stock Bajo
                                        </div>
                                    )}
                                </div>
                                
                                <Link 
                                    to='/dashboard' 
                                    onClick={() => {localStorage.setItem("negocioSeleccionado", JSON.stringify(negocio))}} 
                                    className="w-full text-center bg-gray-900 hover:bg-green-700 text-white py-3 md:py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-green-100"
                                >
                                    Administrar
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Modal de Creación */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm z-[100] p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-gray-800 tracking-tighter mb-6 uppercase border-b border-gray-100 pb-4">Nueva Sucursal</h2>

                        <form onSubmit={onSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nombre del Negocio</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:border-pink-500 transition-all"
                                    {...register("nombre")}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Ubicación (Ciudad)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:border-pink-500 transition-all"
                                    {...register("ubicacion")}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Tipo de Sucursal</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:border-pink-500 transition-all"
                                    {...register("tipo")}
                                />
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-500 font-bold py-4 rounded-xl text-xs uppercase tracking-widest"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-pink-600 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-pink-100"
                                >
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
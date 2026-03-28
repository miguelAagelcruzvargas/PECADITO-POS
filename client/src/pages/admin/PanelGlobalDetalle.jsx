import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaBuilding, FaCashRegister, FaClock, FaExclamationTriangle, FaListUl } from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "../../api/axios";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const PanelGlobalDetalle = () => {
  const [data, setData] = useState({ resumen: null, sucursales: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchDetalle = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/metrics/global-detalle");
      setData(res.data || { resumen: null, sucursales: [] });
    } catch (e) {
      console.error("Error cargando panel global detallado:", e);
      setData({ resumen: null, sucursales: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalle();
    const interval = setInterval(fetchDetalle, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    if (!txt) return data.sucursales || [];
    return (data.sucursales || []).filter((s) =>
      `${s.nombre || ""} ${s.ubicacion || ""} ${s.tipo || ""}`.toLowerCase().includes(txt)
    );
  }, [data.sucursales, search]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Panel Global Detallado</h1>
            <p className="text-gray-500 font-semibold">Vista central por sucursal: turnos, ventas, pedidos y alertas.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/administrador" className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50">
              <FaArrowLeft /> Volver
            </Link>
            <button onClick={fetchDetalle} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold">
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-black text-emerald-600">Ventas Hoy Global</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{money(data?.resumen?.ventas_hoy_total)}</p>
          </div>
          <div className="bg-white border border-pink-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-black text-pink-600">Pedidos Activos</p>
            <p className="text-2xl font-black text-pink-600 mt-1">{Number(data?.resumen?.pedidos_activos_total || 0)}</p>
          </div>
          <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-black text-amber-700">Stock Bajo</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{Number(data?.resumen?.stock_bajo_total || 0)}</p>
          </div>
          <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-black text-sky-700">Sucursales con Turno</p>
            <p className="text-2xl font-black text-sky-700 mt-1">{Number(data?.resumen?.sucursales_con_turno || 0)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-black text-gray-600">Total Sucursales</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{Number(data?.resumen?.total_sucursales || 0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por sucursal, ubicación o tipo..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-pink-500"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                    <FaBuilding />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800 leading-tight">{s.nombre}</h3>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{s.ubicacion || "Sin ubicación"}</p>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => localStorage.setItem("negocioSeleccionado", JSON.stringify({ id: s.id, nombre: s.nombre, ubicacion: s.ubicacion, tipo: s.tipo }))}
                  className="text-xs bg-gray-900 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-black uppercase tracking-wider"
                >
                  Entrar
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-[10px] uppercase tracking-wider font-black text-emerald-700">Ventas Hoy</p>
                  <p className="text-xl font-black text-emerald-700 mt-1">{money(s.ventas_hoy_total)}</p>
                  <p className="text-[11px] text-emerald-700/80 font-semibold mt-1">Local {money(s.ventas_hoy_local)} / Online {money(s.ventas_hoy_online)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                  <p className="text-[10px] uppercase tracking-wider font-black text-gray-700">Movimientos</p>
                  <p className="text-[12px] text-gray-700 font-semibold mt-1">Tickets local: {Number(s.tickets_hoy_local || 0)}</p>
                  <p className="text-[12px] text-gray-700 font-semibold">Online confirmado: {Number(s.pedidos_confirmados_hoy || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-pink-50 border border-pink-100 p-3">
                  <p className="text-[10px] uppercase tracking-wider font-black text-pink-700">Pedidos Activos</p>
                  <p className="text-xl font-black text-pink-700 mt-1">{Number(s.pedidos_activos || 0)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <p className="text-[10px] uppercase tracking-wider font-black text-amber-700">Stock Bajo</p>
                  <p className="text-xl font-black text-amber-700 mt-1">{Number(s.stock_bajo || 0)}</p>
                </div>
              </div>

              <div className="rounded-xl bg-sky-50 border border-sky-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FaClock className="text-sky-700" />
                  <p className="text-[10px] uppercase tracking-wider font-black text-sky-700">Trabajadores en Turno</p>
                </div>
                {(s.turnos_activos || []).length === 0 ? (
                  <p className="text-xs text-gray-500 font-semibold">Sin personal en turno.</p>
                ) : (
                  <div className="space-y-1.5">
                    {s.turnos_activos.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-xs font-semibold text-sky-800">
                        <span>{t.nombre_usuario}</span>
                        <span className="text-sky-700/80">desde {new Date(t.inicio).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!filtered.length && !loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500 font-semibold">
            No hay sucursales para mostrar con ese filtro.
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500 font-semibold">
            Cargando panel detallado...
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelGlobalDetalle;

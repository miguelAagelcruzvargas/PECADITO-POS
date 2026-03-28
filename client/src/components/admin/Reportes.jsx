import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "../../api/axios";

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac'];
const MONEY = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export default function DashboardGraficas() {
  const [loading, setLoading] = useState(false);
  const [reporte, setReporte] = useState({
    kpis: { total_ventas: 0, num_ventas: 0, ticket_promedio: 0, total_gastos: 0, ganancia: 0 },
    por_dia: [],
    por_semana: [],
    por_mes: [],
    por_empleado: [],
    por_canal: [],
    por_producto: []
  });
  const [error, setError] = useState("");

  const negocioId = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;

  // ---------- FORM (rango de fechas) ----------
  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: { desde: "", hasta: "" },
  });
  const [range, setRange] = useState({ desde: "", hasta: "" });

  const fetchReporte = async (filtros = range) => {
    if (!negocioId) return;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filtros.desde) params.set("desde", filtros.desde);
      if (filtros.hasta) params.set("hasta", filtros.hasta);

      const url = `/reporte-avanzado/${negocioId}${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await axios.get(url);
      setReporte(res.data || {});
    } catch (e) {
      setError(e?.response?.data?.message || "No se pudo cargar el reporte avanzado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte({ desde: "", hasta: "" });
  }, [negocioId]);

  const productosTop = useMemo(
    () => [...(reporte.por_producto || [])].sort((a, b) => Number(b.total_ventas || 0) - Number(a.total_ventas || 0)).slice(0, 8),
    [reporte.por_producto]
  );

  const exportarCSV = () => {
    const filas = [];
    filas.push(["KPI", "Valor"]);
    filas.push(["Total ventas", reporte?.kpis?.total_ventas || 0]);
    filas.push(["Numero ventas", reporte?.kpis?.num_ventas || 0]);
    filas.push(["Ticket promedio", reporte?.kpis?.ticket_promedio || 0]);
    filas.push(["Total gastos", reporte?.kpis?.total_gastos || 0]);
    filas.push(["Ganancia", reporte?.kpis?.ganancia || 0]);
    filas.push([]);
    filas.push(["Ventas por empleado"]);
    filas.push(["Empleado", "Num ventas", "Total ventas"]);
    (reporte?.por_empleado || []).forEach((r) => {
      filas.push([r.nombre_usuario, r.num_ventas, r.total_ventas]);
    });
    filas.push([]);
    filas.push(["Top productos"]);
    filas.push(["Producto", "Cantidad", "Total ventas"]);
    (productosTop || []).forEach((r) => {
      filas.push([r.nombre_producto, r.total_cantidad, r.total_ventas]);
    });

    const csv = filas.map((f) => f.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_avanzado_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const compartirResumen = async () => {
    const text = [
      "Reporte de ventas",
      `Total ventas: ${MONEY.format(Number(reporte?.kpis?.total_ventas || 0))}`,
      `Numero ventas: ${Number(reporte?.kpis?.num_ventas || 0)}`,
      `Ticket promedio: ${MONEY.format(Number(reporte?.kpis?.ticket_promedio || 0))}`,
      `Ganancia: ${MONEY.format(Number(reporte?.kpis?.ganancia || 0))}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "Reporte de ventas", text });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        alert("Resumen copiado al portapapeles.");
        return;
      }
      alert(text);
    } catch (_) {
      // no-op
    }
  };

  // ---------- UI ----------
  const desde = watch("desde");
  const hasta = watch("hasta");
  const botonDeshabilitado = loading;

  const onSubmit = ({ desde, hasta }) => {
    const next = { desde, hasta };
    setRange(next);
    fetchReporte(next);
  };

  const limpiar = () => {
    reset({ desde: "", hasta: "" });
    const next = { desde: "", hasta: "" };
    setRange(next);
    fetchReporte(next);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 lg:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-bold text-green-800">Reporte Avanzado</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportarCSV} className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800">Descargar CSV</button>
          <button onClick={compartirResumen} className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800">Compartir</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-lg shadow border border-emerald-100"><p className="text-xs text-gray-500 uppercase">Total ventas</p><p className="text-xl font-black text-emerald-700">{MONEY.format(Number(reporte?.kpis?.total_ventas || 0))}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border border-emerald-100"><p className="text-xs text-gray-500 uppercase">Ventas</p><p className="text-xl font-black text-emerald-700">{Number(reporte?.kpis?.num_ventas || 0)}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border border-emerald-100"><p className="text-xs text-gray-500 uppercase">Ticket promedio</p><p className="text-xl font-black text-emerald-700">{MONEY.format(Number(reporte?.kpis?.ticket_promedio || 0))}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border border-red-100"><p className="text-xs text-gray-500 uppercase">Gastos</p><p className="text-xl font-black text-red-600">{MONEY.format(Number(reporte?.kpis?.total_gastos || 0))}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border border-blue-100"><p className="text-xs text-gray-500 uppercase">Ganancia</p><p className="text-xl font-black text-blue-700">{MONEY.format(Number(reporte?.kpis?.ganancia || 0))}</p></div>
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form
          className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-3 md:gap-4 justify-start items-start"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 font-medium">Desde:</label>
            <input
              type="date"
              className="border border-gray-300 px-3 py-2 rounded"
              {...register("desde", { required: true })}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 font-medium">Hasta:</label>
            <input
              type="date"
              className="border border-gray-300 px-3 py-2 rounded"
              {...register("hasta", { required: true })}
            />
          </div>

          <button
            type="submit"
            disabled={botonDeshabilitado}
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Filtrar'}
          </button>

          <button
            type="button"
            onClick={limpiar}
            className="px-4 py-2 rounded-lg border"
          >
            Limpiar
          </button>

        </form>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      {/* Ventas por dia */}
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <h3 className="text-lg font-semibold text-green-700 mb-2">Ventas por día</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={reporte?.por_dia || []}>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey={"dia"} minTickGap={20} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total_ventas" stroke="#16a34a" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid xl:grid-cols-2 gap-4 lg:gap-6">
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <h3 className="text-lg font-semibold text-green-700 mb-2">Ventas por semana</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={reporte?.por_semana || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total_ventas" fill="#0ea5e9" name="Total" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <h3 className="text-lg font-semibold text-green-700 mb-2">Ventas por mes</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={reporte?.por_mes || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total_ventas" stroke="#10b981" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
      </div>

      {/* Productos vendidos (dona) */}
      <div className="bg-white p-4 rounded-lg shadow grid xl:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-2">Productos más vendidos</h3>
        <ResponsiveContainer width="100%" height={270}>
          <PieChart>
            <Pie
              data={productosTop}
              dataKey="total_cantidad"
              nameKey="nombre_producto"
              cx="50%" cy="50%"
              outerRadius={100}
              innerRadius={60}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {productosTop.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        </div>
        <div className="overflow-auto">
          <h4 className="text-sm font-bold text-gray-700 mb-2">Detalle por producto</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Producto</th>
                <th className="py-2">Cantidad</th>
                <th className="py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {productosTop.map((p) => (
                <tr key={p.nombre_producto} className="border-b last:border-b-0">
                  <td className="py-2 font-semibold text-gray-700">{p.nombre_producto}</td>
                  <td className="py-2">{Number(p.total_cantidad || 0)}</td>
                  <td className="py-2 font-bold text-emerald-700">{MONEY.format(Number(p.total_ventas || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ventas por empleado */}
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <h3 className="text-lg font-semibold text-green-700 mb-2">Ventas por empleado</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={reporte?.por_empleado || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre_usuario" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_ventas" fill="#60a5fa" name="Ventas" />
            <Bar dataKey="num_ventas" fill="#34d399" name="# Tickets" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

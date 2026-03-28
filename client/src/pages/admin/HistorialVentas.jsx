import { useEffect, useMemo, useState } from "react";
import { FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "../../api/axios";
import { useVentas } from "../../context/VentasContext";

function HistorialVentas() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroHistorial, setFiltroHistorial] = useState("todas");
  const { ventas, getValorid: getVentas } = useVentas();

  useEffect(() => {
    getVentas();
  }, []);

  const ventasFiltradas = useMemo(() => {
    return ventas
      .filter((g) => (g.nombre_cliente || "").toLowerCase().includes(busqueda.toLowerCase()))
      .filter((g) => {
        const canal = (g.canal_venta || "Local").toLowerCase();
        if (filtroHistorial === "local") return canal === "local";
        if (filtroHistorial === "online") return canal === "online";
        return true;
      });
  }, [ventas, busqueda, filtroHistorial]);

  const eliminarVenta = async (id) => {
    try {
      const confirm = await Swal.fire({
        title: "Eliminar venta?",
        text: "Se revertira el stock de los productos y se borrara la venta.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Si, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (!confirm.isConfirmed) return;

      await axios.delete(`/ventas/${id}`);
      await getVentas();

      Swal.fire("Eliminada", "La venta fue eliminada y el stock revertido.", "success");
    } catch (e) {
      Swal.fire("Error", "No se pudo eliminar la venta", "error");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold text-green-900">Historial de ventas</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input
          type="text"
          placeholder="Buscar venta por cliente..."
          className="border border-green-500 rounded-lg px-4 py-2 w-full md:w-1/3"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "todas", label: "Todas" },
            { id: "local", label: "Fisicas" },
            { id: "online", label: "Online" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroHistorial(f.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                filtroHistorial === f.id
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white text-green-700 border-green-300 hover:bg-green-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-scroll">
        <table className="min-w-full border border-green-200 text-left">
          <thead className="bg-green-100 text-green-900">
            <tr>
              <th className="px-4 py-3 border-b">Cliente</th>
              <th className="px-4 py-3 border-b">Empleado</th>
              <th className="px-4 py-3 border-b">Tipo</th>
              <th className="px-4 py-3 border-b">Metodo de pago</th>
              <th className="px-4 py-3 border-b">Total</th>
              <th className="px-4 py-3 border-b">Fecha de registro</th>
              <th className="px-4 py-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.map((v) => (
              <tr key={v.uid || `${v.tipo_registro || "venta"}-${v.id}`} className="border-t">
                <td className="px-4 py-3">{v.nombre_cliente}</td>
                <td className="px-4 py-3 text-sm font-semibold text-green-700">{v.nombre_usuario}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      v.canal_venta === "Online" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {v.canal_venta === "Online" ? "Pedido online" : "Venta fisica"}
                  </span>
                </td>
                <td className="px-4 py-3">{v.metodo_pago}</td>
                <td className="px-4 py-3">${v.total}</td>
                <td className="px-4 py-3">{new Date(v.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {v.tipo_registro === "pedido_online" ? (
                    <span className="text-xs text-gray-400 font-semibold">Solo lectura</span>
                  ) : (
                    <button
                      onClick={() => eliminarVenta(v.id)}
                      className="bg-red-500 text-white py-2 px-3 rounded-lg text-md cursor-pointer hover:bg-red-600"
                    >
                      <FaTrash />
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {ventasFiltradas.length === 0 && (
              <tr>
                <td className="px-4 py-5 text-gray-500 text-center" colSpan={7}>
                  No hay registros para el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistorialVentas;

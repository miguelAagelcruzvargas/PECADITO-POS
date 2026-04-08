import { useState, useEffect, useCallback } from "react";
import axios from "../../api/axios";
import Swal from "sweetalert2";
import { FaArrowUp, FaArrowDown, FaWallet, FaPlus, FaMinus } from "react-icons/fa";
import { useTurno } from "../../context/TurnoContext";
import { useAuth } from "../../context/UsuariosContext";

export default function GestionCaja() {
  const { turnoActual } = useTurno();
  const { user } = useAuth();
  const negocioSeleccionado = JSON.parse(localStorage.getItem("negocioSeleccionado"));
  const negocioId = negocioSeleccionado?.id;

  const [movimientos, setMovimientos] = useState([]);
  const [balance, setBalance] = useState({ total_ingresos: 0, total_egresos: 0, balance_neto: 0, num_movimientos: 0 });
  const [cortesDia, setCortesDia] = useState([]);
  const [resumenCortes, setResumenCortes] = useState({ total_esperado: 0, total_declarado: 0, total_diferencia: 0, num_cortes: 0 });
  const [showModal, setShowModal] = useState(false);
  const [tipoModal, setTipoModal] = useState("ingreso");
  const [form, setForm] = useState({ monto: "", concepto: "" });
  const [loading, setLoading] = useState(false);

  const cargarDatos = useCallback(async () => {
    if (!negocioId) return;
    try {
      const turnoParam = turnoActual?.id ? `?turno_id=${turnoActual.id}` : "";
      const [movRes, balRes, cortesRes] = await Promise.all([
        axios.get(`/caja/movimientos/${negocioId}${turnoParam}`),
        axios.get(`/caja/balance/${negocioId}${turnoParam}`),
        axios.get(`/turnos/cortes-dia/${negocioId}`)
      ]);
      setMovimientos(movRes.data);
      setBalance(balRes.data);
      setCortesDia(cortesRes.data?.cortes || []);
      setResumenCortes(cortesRes.data?.resumen || { total_esperado: 0, total_declarado: 0, total_diferencia: 0, num_cortes: 0 });
    } catch (e) {
      console.error(e);
    }
  }, [negocioId, turnoActual?.id]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const abrirModal = (tipo) => {
    setTipoModal(tipo);
    setForm({ monto: "", concepto: "" });
    setShowModal(true);
  };

  const handleRegistrar = async (e) => {
    e.preventDefault();
    if (!form.monto || parseFloat(form.monto) <= 0) return Swal.fire("Monto inválido", "Ingresa un monto mayor a 0", "warning");
    if (!form.concepto.trim()) return Swal.fire("Falta el concepto", "Describe el motivo del movimiento", "warning");

    setLoading(true);
    try {
      await axios.post("/caja/movimiento", {
        negocio_id: negocioId,
        turno_id: turnoActual?.id || null,
        usuario_id: user?.id,
        tipo: tipoModal,
        monto: parseFloat(form.monto),
        concepto: form.concepto
      });
      setShowModal(false);
      Swal.fire({
        toast: true, position: "top-end", icon: "success",
        title: `${tipoModal === "ingreso" ? "Ingreso" : "Egreso"} registrado`,
        showConfirmButton: false, timer: 2000
      });
      cargarDatos();
    } catch (err) {
      Swal.fire("Error", "No se pudo registrar el movimiento", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n) => `$${parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatTime = (d) => new Date(d).toLocaleString("es-MX", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });

  const ajustarCorte = async (corte) => {
    const { value: values } = await Swal.fire({
      title: `Ajustar corte · ${corte.nombre_usuario}`,
      html: `
        <input id="swal-monto-real" type="number" min="0" step="0.01" class="swal2-input" placeholder="Monto real en caja" value="${Number(corte.monto_real_admin ?? corte.monto_final_declarado ?? 0).toFixed(2)}" />
        <textarea id="swal-nota" class="swal2-textarea" placeholder="Nota de ajuste (opcional)">${corte.ajuste_admin_nota || ''}</textarea>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar ajuste',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c026d3',
      preConfirm: () => {
        const montoReal = document.getElementById('swal-monto-real')?.value;
        const nota = document.getElementById('swal-nota')?.value || '';
        if (montoReal === '' || Number(montoReal) < 0) {
          Swal.showValidationMessage('Ingresa un monto real valido');
          return;
        }
        return { montoReal: Number(montoReal), nota };
      }
    });

    if (!values) return;

    try {
      await axios.post('/turnos/corte-ajuste', {
        turno_id: corte.id,
        monto_real_admin: values.montoReal,
        nota: values.nota,
        admin_usuario_id: user?.id || null,
      });

      Swal.fire({ icon: 'success', title: 'Ajuste guardado', timer: 1600, showConfirmButton: false, toast: true, position: 'top-end' });
      cargarDatos();
    } catch (_e) {
      Swal.fire('Error', 'No se pudo guardar el ajuste del corte', 'error');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold text-purple-900">Gestión de Caja</h1>
      <p className="text-sm text-gray-500 -mt-2">
        {turnoActual ? `Turno activo · ${balance.num_movimientos} movimiento${balance.num_movimientos !== 1 ? 's' : ''}` : 'Sin turno activo — mostrando todos los movimientos'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-fuchsia-600 text-white rounded-xl px-4 py-3 border border-fuchsia-700">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-90">Balance neto</p>
          <p className="text-2xl font-black mt-1">{balance.balance_neto >= 0 ? '' : '-'}{formatCurrency(Math.abs(balance.balance_neto))}</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-fuchsia-200">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Ingresos</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(balance.total_ingresos)}</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-fuchsia-200">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Egresos</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{formatCurrency(balance.total_egresos)}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <button
          onClick={() => abrirModal("ingreso")}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-all"
        >
          <FaPlus /> Registrar Ingreso
        </button>
        <button
          onClick={() => abrirModal("egreso")}
          className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-all"
        >
          <FaMinus /> Registrar Egreso
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-purple-900">Cortes del Día (Conciliación)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl px-4 py-3 border border-fuchsia-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-700">Cortes cerrados</p>
            <p className="text-2xl font-black text-fuchsia-700 mt-1">{Number(resumenCortes.num_cortes || 0)}</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 border border-fuchsia-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Esperado total</p>
            <p className="text-xl font-black text-blue-700 mt-1">{formatCurrency(resumenCortes.total_esperado)}</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 border border-fuchsia-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Declarado total</p>
            <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(resumenCortes.total_declarado)}</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 border border-fuchsia-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Real admin total</p>
            <p className="text-xl font-black text-indigo-700 mt-1">{formatCurrency(resumenCortes.total_real_admin)}</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 border border-fuchsia-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Ajuste / diferencia</p>
            <p className={`text-xl font-black mt-1 ${Number(resumenCortes.total_diferencia_final || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {Number(resumenCortes.total_diferencia_final || 0) >= 0 ? '+' : '-'}{formatCurrency(Math.abs(Number(resumenCortes.total_diferencia_final || 0)))}
            </p>
          </div>
        </div>

        <div className="table-scroll">
          {cortesDia.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-semibold">No hay cortes cerrados hoy en esta sucursal.</p>
            </div>
          ) : (
            <table className="min-w-full border border-fuchsia-300 text-left">
              <thead className="bg-fuchsia-100 text-fuchsia-900">
                <tr>
                  <th className="px-4 py-3 border-b">Empleado</th>
                  <th className="px-4 py-3 border-b">Apertura</th>
                  <th className="px-4 py-3 border-b">Esperado</th>
                  <th className="px-4 py-3 border-b">Declarado</th>
                  <th className="px-4 py-3 border-b">Real admin</th>
                  <th className="px-4 py-3 border-b">Diferencia</th>
                  <th className="px-4 py-3 border-b">Nota admin</th>
                  <th className="px-4 py-3 border-b">Hora cierre</th>
                  <th className="px-4 py-3 border-b">Accion</th>
                </tr>
              </thead>
              <tbody>
                {cortesDia.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3 font-semibold text-gray-800">{c.nombre_usuario}</td>
                    <td className="px-4 py-3">{formatCurrency(c.monto_inicial)}</td>
                    <td className="px-4 py-3 text-blue-700 font-bold">{formatCurrency(c.monto_esperado_caja)}</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold">{formatCurrency(c.monto_final_declarado)}</td>
                    <td className="px-4 py-3 text-indigo-700 font-bold">{formatCurrency(c.monto_real_admin != null ? c.monto_real_admin : c.monto_final_declarado)}</td>
                    <td className={`px-4 py-3 font-black ${Number(c.diferencia_caja_final || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {Number(c.diferencia_caja_final || 0) >= 0 ? '+' : '-'}{formatCurrency(Math.abs(Number(c.diferencia_caja_final || 0)))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[220px]">{c.ajuste_admin_nota || '-'}</td>
                    <td className="px-4 py-3 text-sm">{formatTime(c.fin)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => ajustarCorte(c)}
                        className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        Ajustar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="table-scroll">
        {movimientos.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-10 text-center border-2 border-dashed border-gray-200">
            <FaWallet className="text-gray-300 text-4xl mx-auto mb-3" />
            <p className="text-gray-400 font-bold">No hay movimientos registrados</p>
          </div>
        ) : (
          <table className="min-w-full border border-fuchsia-300 text-left">
            <thead className="bg-fuchsia-100 text-fuchsia-900">
              <tr>
                <th className="px-4 py-3 border-b">Tipo</th>
                <th className="px-4 py-3 border-b">Concepto</th>
                <th className="px-4 py-3 border-b">Monto</th>
                <th className="px-4 py-3 border-b">Empleado</th>
                <th className="px-4 py-3 border-b">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${m.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{m.concepto}</td>
                  <td className={`px-4 py-3 font-black ${m.tipo === 'ingreso' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {m.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(m.monto)}
                  </td>
                  <td className="px-4 py-3">{m.nombre_usuario || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{formatTime(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de registro */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 text-white ${tipoModal === 'ingreso' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                    {tipoModal === 'ingreso' ? <FaArrowUp /> : <FaArrowDown />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase">Registrar {tipoModal === 'ingreso' ? 'Ingreso' : 'Egreso'}</h3>
                    <p className="text-white/70 text-xs font-bold">Turno {turnoActual?.id ? `#${turnoActual.id}` : 'no activo'}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white text-xl">✕</button>
              </div>
            </div>

            <form onSubmit={handleRegistrar} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Concepto / Descripción</label>
                <input
                  type="text"
                  required
                  placeholder={tipoModal === 'ingreso' ? "Ej: Depósito inicial, pago cliente…" : "Ej: Compra insumos, pago proveedor…"}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-200 rounded-2xl px-4 py-3 font-bold text-sm outline-none transition-all"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Monto ($)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-200 rounded-2xl px-4 py-3 font-black text-lg outline-none transition-all"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 ${tipoModal === 'ingreso' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-100' : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-100'}`}
              >
                {loading ? "Registrando..." : `✔ Registrar ${tipoModal === 'ingreso' ? 'Ingreso' : 'Egreso'}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

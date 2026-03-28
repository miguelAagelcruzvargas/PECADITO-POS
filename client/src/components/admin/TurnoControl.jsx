import { useState, useEffect, useRef } from "react";
import { useTurno } from "../../context/TurnoContext";
import { useReactToPrint } from "react-to-print";
import axios from "../../api/axios";
import Swal from "sweetalert2";
import { FaPlay, FaStop, FaPrint, FaHistory } from "react-icons/fa";
import { useAuth } from "../../context/UsuariosContext";

const TurnoControl = () => {
  const { turnoActual, iniciarTurno, cerrarTurno } = useTurno();
  const { user } = useAuth();
  const [monto, setMonto] = useState("");
  const [historial, setHistorial] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [reporteTurno, setReporteTurno] = useState(null);
  const [showReporte, setShowReporte] = useState(false);
  const reporteRef = useRef();
  const isEmpleado = user?.role === "Empleado";

  const getReminderKey = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `cierre_reminder_${user?.id || "anon"}_${y}-${m}-${d}`;
  };

  const handlePrintReporte = useReactToPrint({ contentRef: reporteRef });

  const idNegocio = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;

  const cargarHistorial = async () => {
    if (!idNegocio) return;
    try {
      const res = await axios.get(`/turnos/historial/${idNegocio}`);
      setHistorial(res.data);
    } catch (e) { console.error(e); }
  };

  const verReporte = async (idTurno) => {
    try {
      const res = await axios.get(`/turnos/reporte/${idTurno}`);
      setReporteTurno(res.data);
      setShowReporte(true);
    } catch (e) {
      Swal.fire("Error", "No se pudo cargar el reporte", "error");
    }
  };

  const handleIniciar = async () => {
    if (!monto) return Swal.fire("Falta el monto", "Ingresa el monto inicial de caja", "warning");
    try {
      await iniciarTurno(parseFloat(monto));
      Swal.fire({ title: "Turno iniciado", icon: "success", toast: true, position: "top-end", timer: 2000, showConfirmButton: false });
      setMonto("");
    } catch (e) {
      Swal.fire("Error", "No se pudo iniciar el turno", "error");
    }
  };

  const handleCerrar = async () => {
    const { value: confirm } = await Swal.fire({
      title: "¿Finalizar corte y cerrar turno?",
      text: "Se hará el recuento automático de ventas Local/Online y se cerrará la caja.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444"
    });
    if (!confirm) return;

    try {
      await cerrarTurno();
      const reporteFinal = await axios.get(`/turnos/reporte/${turnoActual.id}`);
      setReporteTurno(reporteFinal.data);
      setShowReporte(true);
      localStorage.removeItem(getReminderKey());
      Swal.fire({
        title: "Turno cerrado",
        text: `Corte final de ${user?.nombre || "empleado"} generado correctamente.`,
        icon: "success",
        toast: true,
        position: "top-end",
        timer: 2500,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire("Error", "No se pudo cerrar el turno", "error");
    }
  };

  useEffect(() => {
    if (showHistorial) cargarHistorial();
  }, [showHistorial]);

  useEffect(() => {
    if (!isEmpleado || turnoActual || !user?.id) return;

    const keyPrompt = `turno_prompt_${user.id}`;
    if (sessionStorage.getItem(keyPrompt) === "1") return;

    sessionStorage.setItem(keyPrompt, "1");

    Swal.fire({
      title: `Hola, ${user?.nombre || "empleado"}`,
      text: "Tu turno no está iniciado. Ingresa fondo inicial para abrir caja.",
      input: "number",
      inputLabel: "Monto inicial de caja",
      inputPlaceholder: "0.00",
      showCancelButton: true,
      confirmButtonText: "Iniciar turno",
      cancelButtonText: "Más tarde",
      inputAttributes: { min: 0, step: 0.01 },
      inputValidator: (value) => {
        if (value === "" || Number(value) < 0) return "Ingresa un monto válido";
      }
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await iniciarTurno(parseFloat(result.value));
        Swal.fire({
          title: `Turno iniciado: ${user?.nombre || "empleado"}`,
          text: `Entrada registrada a las ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
          icon: "success",
          toast: true,
          position: "top-end",
          timer: 2800,
          showConfirmButton: false
        });
      } catch (e) {
        Swal.fire("Error", "No se pudo iniciar el turno", "error");
      }
    });
  }, [isEmpleado, turnoActual, user?.id, user?.nombre, iniciarTurno]);

  useEffect(() => {
    if (!isEmpleado || !turnoActual || !user?.id) return;

    const checkReminder = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      // 9:45 PM o más tarde
      if (hour < 21 || (hour === 21 && minute < 45)) return;

      const reminderKey = getReminderKey();
      if (localStorage.getItem(reminderKey) === "1") return;

      localStorage.setItem(reminderKey, "1");
      Swal.fire({
        title: "Recordatorio de cierre",
        text: `${user?.nombre || "Empleado"}, ya es hora de finalizar corte y cerrar turno.`,
        icon: "info",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#16a34a"
      });
    };

    checkReminder();
    const timer = setInterval(checkReminder, 60000);
    return () => clearInterval(timer);
  }, [isEmpleado, turnoActual, user?.id, user?.nombre]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-green-100 mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-green-700 to-green-600 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <span className="text-2xl">🕐</span>
          <div>
            <h2 className="text-base md:text-lg font-black">Control de Turno y Caja</h2>
            <p className="text-green-100 text-xs">{turnoActual ? `Jornada activa desde ${new Date(turnoActual.inicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : "Sin turno activo"}</p>
          </div>
        </div>
        <button onClick={() => setShowHistorial(!showHistorial)} className="text-white/80 hover:text-white flex items-center gap-2 text-[11px] md:text-xs font-bold border border-white/30 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl transition-colors">
          <FaHistory /> Historial
        </button>
      </div>

      <div className="p-4 md:p-6">
        {!turnoActual ? (
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monto inicial en caja ($)</label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-green-300 transition-colors text-lg font-bold"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <button
              onClick={handleIniciar}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-100 whitespace-nowrap"
            >
              <FaPlay className="text-xs" /> Iniciar Jornada
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-green-50 p-4 rounded-2xl border border-green-100">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase text-green-600 tracking-widest">Apertura</p>
                <p className="text-xl font-black text-green-900">${parseFloat(turnoActual.monto_inicial || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-green-600 tracking-widest">Empleado</p>
                <p className="text-sm font-bold text-green-800">{turnoActual.nombre_usuario || "En curso"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => verReporte(turnoActual.id)} className="bg-white border-2 border-green-200 text-green-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-green-50">
                <FaPrint className="text-xs" /> Reporte X
              </button>
              <button onClick={handleCerrar} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-100">
                <FaStop className="text-xs" /> Finalizar Corte y Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Historial */}
        {showHistorial && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><FaHistory /> Últimos Turnos</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {historial.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No hay historial disponible</p>
              ) : historial.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{t.nombre_usuario}</p>
                    <p className="text-xs text-gray-400">{new Date(t.inicio).toLocaleString('es-MX')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-green-700">${parseFloat(t.total_ventas || 0).toFixed(2)}</p>
                    <button onClick={() => verReporte(t.id)} className="text-xs text-blue-500 hover:underline">Ver corte</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Reporte X/Z */}
      {showReporte && reporteTurno && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 text-white text-center">
              <p className="text-xs tracking-widest uppercase opacity-70 mb-1">Corte de Caja</p>
              <h2 className="text-2xl font-black">Reporte X/Z</h2>
              <p className="text-gray-300 text-sm mt-1">Turno #{reporteTurno.id}</p>
            </div>

            {/* Contenido imprimible */}
            <div ref={reporteRef} className="p-6 font-mono text-sm">
              <div className="text-center mb-4">
                <p className="text-xl font-black">CORTE DE CAJA</p>
                <p className="text-gray-500 text-xs">{new Date().toLocaleString('es-MX')}</p>
              </div>
              <div className="border-t border-dashed pt-4 space-y-3">
                <div className="flex justify-between"><span className="text-gray-500">Empleado:</span><span className="font-bold">{reporteTurno.nombre_usuario}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sucursal:</span><span className="font-bold">{reporteTurno.nombre_negocio || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Apertura:</span><span>{new Date(reporteTurno.inicio).toLocaleTimeString('es-MX')}</span></div>
                {reporteTurno.fin && <div className="flex justify-between"><span className="text-gray-500">Cierre:</span><span>{new Date(reporteTurno.fin).toLocaleTimeString('es-MX')}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500"># Ventas:</span><span className="font-bold">{reporteTurno.num_ventas || 0}</span></div>
                <div className="border-t border-dashed pt-3">
                  <div className="flex justify-between"><span className="text-gray-500">Ventas Locales:</span><span>{reporteTurno.num_ventas_local || 0} (${parseFloat(reporteTurno.total_local || 0).toFixed(2)})</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ventas Online:</span><span>{reporteTurno.num_ventas_online || 0} (${parseFloat(reporteTurno.total_online || 0).toFixed(2)})</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Fondo inicial:</span><span>${parseFloat(reporteTurno.monto_inicial || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ventas del turno:</span><span>${parseFloat(reporteTurno.total_ventas || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between text-lg font-black pt-2 border-t border-dashed mt-2">
                    <span>TOTAL EN CAJA:</span>
                    <span className="text-green-700">${parseFloat(reporteTurno.total_caja_final || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-400 text-[10px] mt-6 italic">Fresas con Crema POS System</p>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowReporte(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold">Cerrar</button>
              <button onClick={handlePrintReporte} className="flex-1 bg-gray-800 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2">
                <FaPrint /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurnoControl;

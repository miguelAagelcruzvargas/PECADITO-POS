import { useState, useEffect, useRef } from "react";
import { useTurno } from "../../context/TurnoContext";
import { useReactToPrint } from "react-to-print";
import axios from "../../api/axios";
import Swal from "sweetalert2";
import { FaPlay, FaStop, FaPrint, FaHistory } from "react-icons/fa";
import { useAuth } from "../../context/UsuariosContext";

const TurnoControl = () => {
  const { turnoActual, iniciarTurno, cerrarTurno, checkTurnoActivo } = useTurno();
  const { user } = useAuth();
  const [monto, setMonto] = useState("");
  const [historial, setHistorial] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [reporteTurno, setReporteTurno] = useState(null);
  const [showReporte, setShowReporte] = useState(false);
  const reporteRef = useRef();
  const avisoTiempoRef = useRef(false);
  const isEmpleado = user?.role === "Empleado";

  const buildExpectedEndDate = () => {
    if (!turnoActual?.inicio) return null;

    const salidaStr = turnoActual?.horario_salida || user?.horario_salida;
    if (!salidaStr) return null;

    const [hRaw, mRaw] = String(salidaStr).split(":");
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;

    const inicio = new Date(turnoActual.inicio);
    const finProgramado = new Date(inicio);
    finProgramado.setHours(h, m, 0, 0);

    // Si el horario de salida es menor a la hora de inicio, asumimos salida al dia siguiente.
    if (finProgramado <= inicio) {
      finProgramado.setDate(finProgramado.getDate() + 1);
    }

    const extra = Number(turnoActual?.minutos_extra_autorizados || 0);
    finProgramado.setMinutes(finProgramado.getMinutes() + extra);
    return finProgramado;
  };

  const maybeMostrarAvisoSalida = async (minutesLeft, stage) => {
    if (avisoTiempoRef.current) return;
    avisoTiempoRef.current = true;

    const etapa = Number(stage || 0);
    const tipoAviso = minutesLeft <= 3 ? "3" : "5";
    const key = `turno_extra_warn_${turnoActual?.id}_${etapa}_${tipoAviso}`;
    if (sessionStorage.getItem(key) === "1") {
      avisoTiempoRef.current = false;
      return;
    }

    sessionStorage.setItem(key, "1");
    const res = await Swal.fire({
      title: "Tu salida ya se acerca",
      html: `
        <div style="text-align:left">
          <p style="margin:0 0 8px; color:#374151; font-size:14px;">Faltan <strong>${Math.max(0, Math.ceil(minutesLeft))} minutos</strong> para finalizar tu horario.</p>
          <p style="margin:0; color:#6b7280; font-size:12px;">Si hay mucha venta, puedes extender tu tiempo 10 minutos.</p>
        </div>
      `,
      icon: "info",
      showCancelButton: false,
      showDenyButton: true,
      confirmButtonText: "Extender 10 min",
      denyButtonText: "Continuar sin extender",
      confirmButtonColor: "#c026d3",
      denyButtonColor: "#6b7280",
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    if (res.isConfirmed && turnoActual?.id) {
      try {
        await axios.post("/turnos/extender", { id: turnoActual.id, minutos: 10 });
        await checkTurnoActivo();
        Swal.fire({
          title: "Horario extendido",
          text: "Se agregaron 10 minutos extra a tu turno.",
          icon: "success",
          toast: true,
          position: "top-end",
          timer: 2200,
          showConfirmButton: false
        });
      } catch (_e) {
        Swal.fire("Error", "No se pudo extender el turno", "error");
      }
    }

    avisoTiempoRef.current = false;
  };

  const getReminderKey = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `cierre_reminder_${user?.id || "anon"}_${y}-${m}-${d}`;
  };

  const getCierreDiaKey = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `turno_cerrado_${user?.id || "anon"}_${y}-${m}-${d}`;
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
      localStorage.removeItem(getCierreDiaKey());
      Swal.fire({ title: "Turno iniciado", icon: "success", toast: true, position: "top-end", timer: 2000, showConfirmButton: false });
      setMonto("");
    } catch (e) {
      Swal.fire("Error", "No se pudo iniciar el turno", "error");
    }
  };

  const handleCerrar = async () => {
    // Paso 1: obtener reporte previo del turno para mostrar totales
    let reportePrevio = null;
    try {
      const rpRes = await axios.get(`/turnos/reporte/${turnoActual.id}`);
      reportePrevio = rpRes.data;
    } catch (e) {
      // si falla el reporte previo, igual permitimos cerrar
    }

    const totalEfectivo = parseFloat(reportePrevio?.total_efectivo ?? reportePrevio?.total_local ?? 0);
    const totalTransferencia = parseFloat(reportePrevio?.total_transferencia ?? reportePrevio?.total_online ?? 0);
    const totalIngresosCaja = parseFloat(reportePrevio?.total_ingresos_caja || 0);
    const totalEgresosCaja = parseFloat(reportePrevio?.total_egresos_caja || 0);
    const montoApertura = parseFloat(reportePrevio?.monto_inicial || turnoActual?.monto_inicial || 0);
    const esperadoEfectivo = montoApertura + totalEfectivo + totalIngresosCaja - totalEgresosCaja;

    const { value: montoDeclarado } = await Swal.fire({
      title: '💳 Cierre de Turno',
      html: `
        <div style="text-align:left; font-family:system-ui; padding:0 2px; max-height:120px; overflow-y:auto; margin-bottom:4px;">
          <p style="font-size:11px; font-weight:800; color:#16a34a; text-transform:uppercase; letter-spacing:0.05em; margin:0 0 8px">Resumen rápido</p>
          <div style="display:grid; grid-template-columns:1fr auto; gap:4px 8px; font-size:11px; margin-bottom:8px;">
            <span style="color:#4b5563">Apertura:</span><strong style="color:#374151">$${montoApertura.toFixed(2)}</strong>
            <span style="color:#4b5563">Efectivo:</span><strong style="color:#166534">$${totalEfectivo.toFixed(2)}</strong>
            <span style="color:#4b5563">Transferencias:</span><strong style="color:#1d4ed8">$${totalTransferencia.toFixed(2)}</strong>
            <span style="color:#4b5563">Ingresos caja:</span><strong style="color:#047857">$${totalIngresosCaja.toFixed(2)}</strong>
            <span style="color:#4b5563">Egresos caja:</span><strong style="color:#dc2626">$${totalEgresosCaja.toFixed(2)}</strong>
          </div>
          <div style="background:#eff6ff; border-radius:10px; padding:8px 10px; border:1px solid #bfdbfe; margin-bottom:4px;">
            <p style="font-size:10px; font-weight:800; color:#1d4ed8; text-transform:uppercase; letter-spacing:0.05em; margin:0 0 2px">Efectivo esperado</p>
            <p style="font-size:22px; font-weight:900; color:#1e3a8a; margin:0; line-height:1.1">$${esperadoEfectivo.toFixed(2)}</p>
          </div>
        </div>
      `,
      width: 410,
      heightAuto: false,
      input: 'number',
      inputLabel: 'Monto real en caja',
      inputPlaceholder: '0.00',
      inputAttributes: { min: 0, step: 0.01 },
      showCancelButton: true,
      confirmButtonText: 'Cerrar turno ✔',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      didOpen: () => {
        const popup = Swal.getPopup();
        const html = Swal.getHtmlContainer();
        if (popup) {
          popup.style.maxHeight = '88vh';
          popup.style.overflowY = 'auto';
          popup.style.paddingTop = '0.8rem';
          popup.style.paddingBottom = '0.9rem';
        }
        if (html) {
          html.style.margin = '0.35rem 0 0.2rem';
          html.style.maxHeight = '36vh';
          html.style.overflowY = 'auto';
        }
      },
      inputValidator: (value) => {
        if (value === '' || value === null || value === undefined) return '¡Ingresa el monto real en caja!';
        if (Number(value) < 0) return 'El monto no puede ser negativo';
      }
    });

    if (montoDeclarado === undefined) return; // cancelado

    try {
      const resultado = await cerrarTurno(parseFloat(montoDeclarado));
      const diferencia = resultado?.diferencia_caja ?? null;
      const reporteFinal = await axios.get(`/turnos/reporte/${turnoActual?.id || 0}`);
      setReporteTurno({ ...reporteFinal.data, monto_final_declarado: parseFloat(montoDeclarado), diferencia_caja: diferencia });
      setShowReporte(true);
      localStorage.removeItem(getReminderKey());
      localStorage.setItem(getCierreDiaKey(), "1");

      const diferenciaMsg = diferencia != null
        ? diferencia >= 0
          ? `✅ Sobrante: $${Math.abs(diferencia).toFixed(2)}`
          : `⚠️ Faltante: $${Math.abs(diferencia).toFixed(2)}`
        : '';

      Swal.fire({
        title: "Turno cerrado",
        text: `Corte de ${user?.nombre || 'empleado'} finalizado. ${diferenciaMsg}`,
        icon: diferencia != null && diferencia < 0 ? 'warning' : 'success',
        toast: true,
        position: "top-end",
        timer: 3500,
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

  useEffect(() => {
    if (!isEmpleado || !turnoActual?.id) return;

    const checkSalidaCercana = async () => {
      const expectedEnd = buildExpectedEndDate();
      if (!expectedEnd) return;

      const now = new Date();
      const minutesLeft = (expectedEnd.getTime() - now.getTime()) / 60000;
      const stage = Number(turnoActual?.num_extensiones || 0);

      if (minutesLeft <= 5 && minutesLeft > 3) {
        await maybeMostrarAvisoSalida(minutesLeft, stage);
      }

      if (minutesLeft <= 3 && minutesLeft >= 0) {
        await maybeMostrarAvisoSalida(minutesLeft, stage);
      }
    };

    checkSalidaCercana();
    const timer = setInterval(checkSalidaCercana, 30000);
    return () => clearInterval(timer);
  }, [isEmpleado, turnoActual?.id, turnoActual?.horario_salida, turnoActual?.minutos_extra_autorizados, turnoActual?.num_extensiones]);

  return (
    <>
      {/* Modal bloqueante de inicio de turno */}
      {!turnoActual && isEmpleado && localStorage.getItem(getCierreDiaKey()) !== "1" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-fuchsia-700 to-purple-700 px-6 py-5 text-white text-center">
              <span className="text-4xl block mb-2">🏪</span>
              <h2 className="text-xl font-black">Abrir Caja</h2>
              <p className="text-fuchsia-200 text-xs mt-1">Ingresa el fondo inicial para comenzar la jornada</p>
            </div>
            <div className="p-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monto inicial en caja ($)</label>
              <input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full border-2 border-fuchsia-200 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500 transition-colors text-2xl font-black text-center mb-4"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleIniciar(); }}
                autoFocus
              />
              <button
                onClick={handleIniciar}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 active:scale-95 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-fuchsia-200 text-lg"
              >
                <FaPlay size={14} /> Iniciar Jornada
              </button>
            </div>
          </div>
        </div>
      )}

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
          <p className="text-sm text-gray-400 text-center py-2">Abre la caja usando el panel de inicio.</p>
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[88vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 md:p-5 text-white text-center flex-shrink-0">
              <p className="text-xs tracking-widest uppercase opacity-70 mb-1">Corte de Caja</p>
              <h2 className="text-2xl font-black">Reporte X/Z</h2>
              <p className="text-gray-300 text-sm mt-1">Turno #{reporteTurno.id}</p>
            </div>

            {/* Contenido imprimible */}
            <div ref={reporteRef} className="p-4 md:p-5 font-mono text-xs md:text-sm overflow-y-auto flex-1 print:overflow-visible">
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
                <div className="border-t border-dashed pt-3 space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Ventas Locales:</span><span>{reporteTurno.num_ventas_local || 0} (${parseFloat(reporteTurno.total_local || 0).toFixed(2)})</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ventas Online:</span><span>{reporteTurno.num_ventas_online || 0} (${parseFloat(reporteTurno.total_online || 0).toFixed(2)})</span></div>
                  <div className="border-t border-dashed pt-2 mt-1">
                    <div className="flex justify-between font-bold text-green-700"><span>💵 Total Efectivo:</span><span>${parseFloat(reporteTurno.total_efectivo || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-blue-700"><span>🏦 Total Transferencia:</span><span>${parseFloat(reporteTurno.total_transferencia || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-emerald-700"><span>➕ Ingresos de caja:</span><span>${parseFloat(reporteTurno.total_ingresos_caja || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-rose-700"><span>➖ Egresos de caja:</span><span>${parseFloat(reporteTurno.total_egresos_caja || 0).toFixed(2)}</span></div>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-500">Fondo inicial:</span><span>${parseFloat(reporteTurno.monto_inicial || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between text-lg font-black pt-2 border-t border-dashed mt-2">
                    <span>EFECTIVO ESPERADO:</span>
                    <span className="text-green-700">${parseFloat(reporteTurno.monto_esperado_caja || reporteTurno.total_caja_final || 0).toFixed(2)}</span>
                  </div>
                  {reporteTurno.monto_final_declarado != null && (
                    <div className="border-t border-dashed pt-2 mt-1">
                      <div className="flex justify-between"><span className="text-gray-500">Monto declarado:</span><span>${parseFloat(reporteTurno.monto_final_declarado).toFixed(2)}</span></div>
                      {reporteTurno.diferencia_caja != null && (
                        <div className={`flex justify-between font-black text-base mt-1 ${parseFloat(reporteTurno.diferencia_caja) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <span>{parseFloat(reporteTurno.diferencia_caja) >= 0 ? '✅ Sobrante:' : '⚠️ Faltante:'}</span>
                          <span>${Math.abs(parseFloat(reporteTurno.diferencia_caja)).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-center text-gray-400 text-[10px] mt-6 italic">Fresas con Crema POS System</p>
            </div>

            <div className="px-4 md:px-5 pb-4 md:pb-5 pt-2 flex gap-3 flex-shrink-0 bg-white border-t border-gray-100">
              <button onClick={() => setShowReporte(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold">Cerrar</button>
              <button onClick={handlePrintReporte} className="flex-1 bg-gray-800 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2">
                <FaPrint /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default TurnoControl;

import { useState, useEffect } from "react";
import { ImCancelCircle } from "react-icons/im";
import { FaCheckCircle, FaMobileAlt, FaWhatsapp } from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "../../api/axios";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import TicketPrint from "./TicketPrint";

const Pedidos = () => {
  const STATUS_PREPARACION = "En preparacion";
  const [tab, setTab] = useState("redes"); // "redes" | "digital"
  const [pedidosDigitales, setPedidosDigitales] = useState([]);
  const [pedidosDigitalesHistorial, setPedidosDigitalesHistorial] = useState([]);
  const [digitalView, setDigitalView] = useState("activos"); // "activos" | "historial"
  const [manualPedido, setManualPedido] = useState({
    cliente_nombre: "",
    total: "",
    canal_origen: "WhatsApp",
    contacto_cliente: "",
    notas_cliente: "",
    tipo_entrega: "Recoger",
    direccion: ""
  });
  const [ticketConfig, setTicketConfig] = useState(null);
  const [negocioInfo, setNegocioInfo] = useState(null);
  const [ticketPedido, setTicketPedido] = useState(null);
  const [pendingPrint, setPendingPrint] = useState(false);
  const negocioSeleccionado = JSON.parse(localStorage.getItem("negocioSeleccionado"));
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const componentRef = useRef();
  const handlePrint = useReactToPrint({ contentRef: componentRef });

  const idNegocio = negocioSeleccionado?.id || usuario?.negocios_id;

  const buildTicketLines = (pedido) => {
    const detalles = Array.isArray(pedido?.detalles) ? pedido.detalles : [];
    if (!detalles.length) {
      return [
        {
          producto: `Pedido Online #${pedido?.id}`,
          cantidad: 1,
          total: Number(pedido?.total || 0).toFixed(2),
          toppings: []
        }
      ];
    }

    return detalles.map((d) => ({
      producto: d.producto || `Producto #${d.producto_id}`,
      cantidad: Number(d.cantidad || 1),
      total: Number(d.subtotal || 0).toFixed(2),
      toppings: []
    }));
  };

  const parseEntregaDetalle = (raw) => {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return { direccion: String(raw) };
    }
  };

  const isPreparacionStatus = (status) => {
    const normalized = (status || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return normalized === 'en preparacion';
  };

  const buildDigitalTicketText = (pedido) => {
    const lineas = buildTicketLines(pedido)
      .map((item) => `• ${item.cantidad}x ${item.producto} - $${Number(item.total).toFixed(2)}`)
      .join("\n");

    return [
      `Ticket Pedido Online #${pedido?.id}`,
      `Cliente: ${pedido?.cliente_nombre || 'Cliente'}`,
      `\n${lineas}`,
      `\nTOTAL: $${Number(pedido?.total || 0).toFixed(2)}`,
      `Estado: Confirmado`
    ].join("\n");
  };

  const handleSendDigitalTicket = async (pedido) => {
    const text = buildDigitalTicketText(pedido);
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encoded}`;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        // Ignorar: abriremos WhatsApp igualmente
      }
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    Swal.fire({
      title: "Ticket digital listo",
      text: "Se abrió WhatsApp y el texto del ticket quedó listo para compartir.",
      icon: "success",
      timer: 2200,
      showConfirmButton: false,
      toast: true,
      position: "top-end"
    });
  };

  const confirmWithTicketOptions = async (pedido) => {
    const resultado = await Swal.fire({
      title: "Pedido confirmado",
      text: "Elige cómo entregar el ticket:",
      icon: "success",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Imprimir ticket",
      denyButtonText: "Enviar digital",
      cancelButtonText: "Cerrar",
      confirmButtonColor: "#16a34a",
      denyButtonColor: "#db2777"
    });

    if (resultado.isConfirmed) {
      setTicketPedido(pedido);
      setPendingPrint(true);
      return;
    }

    if (resultado.isDenied) {
      await handleSendDigitalTicket(pedido);
    }
  };

  useEffect(() => {
    if (pendingPrint && ticketPedido) {
      handlePrint();
      setPendingPrint(false);
    }
  }, [pendingPrint, ticketPedido, handlePrint]);

  const fetchPedidosDigitales = async () => {
    if (!idNegocio) return;
    try {
      const res = await axios.get(`/pedidos-digitales/${idNegocio}?view=active`);
      setPedidosDigitales(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchHistorialPedidosDigitales = async () => {
    if (!idNegocio) return;
    try {
      const res = await axios.get(`/pedidos-digitales/${idNegocio}?view=history`);
      setPedidosDigitalesHistorial(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchTicketResources = async () => {
    if (!idNegocio) return;
    try {
      const [resConfig, resNegocio] = await Promise.all([
        axios.get(`/configuraciones/${idNegocio}`),
        axios.get(`/negocio/${idNegocio}`)
      ]);
      setTicketConfig(resConfig.data || null);
      setNegocioInfo(resNegocio?.data?.data || null);
    } catch (e) {
      console.error(e);
    }
  };

  const marcarPedidoEnPreparacion = async (id) => {
    try {
      await axios.patch(`/pedidos-digitales/${id}`, { status: STATUS_PREPARACION, usuario_id: usuario?.id || null });
      fetchPedidosDigitales();
      fetchHistorialPedidosDigitales();
      Swal.fire({
        title: "Pedido en preparación",
        icon: "success",
        toast: true,
        position: "top-end",
        timer: 1800,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire("Error", "No se pudo actualizar el pedido", "error");
    }
  };

  const marcarPedidoPreparado = async (id) => {
    const pedidoActual = pedidosDigitales.find((p) => p.id === id);
    try {
      await axios.patch(`/pedidos-digitales/${id}`, { status: "Confirmado", usuario_id: usuario?.id || null });
      fetchPedidosDigitales();
      fetchHistorialPedidosDigitales();
      if (pedidoActual) {
        await confirmWithTicketOptions(pedidoActual);
      } else {
        Swal.fire({ title: "Pedido confirmado", icon: "success", toast: true, position: "top-end", timer: 2000, showConfirmButton: false });
      }
    } catch (e) {
      Swal.fire("Error", "No se pudo confirmar el pedido", "error");
    }
  };

  const rechazarPedidoDigital = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: "¿Rechazar pedido?", icon: "warning", showCancelButton: true, confirmButtonText: "Sí, rechazar", confirmButtonColor: "#ef4444" });
    if (!isConfirmed) return;
    try {
      await axios.patch(`/pedidos-digitales/${id}`, { status: "Rechazado" });
      fetchPedidosDigitales();
      fetchHistorialPedidosDigitales();
    } catch (e) { console.error(e); }
  };

  const registrarPedidoRedes = async () => {
    const nombre = manualPedido.cliente_nombre.trim();
    const total = Number(manualPedido.total);

    if (!nombre) {
      Swal.fire("Nombre requerido", "Escribe el nombre del cliente.", "info");
      return;
    }

    if (!Number.isFinite(total) || total <= 0) {
      Swal.fire("Total inválido", "Ingresa un total válido mayor a 0.", "info");
      return;
    }

    try {
      const payload = {
        cliente_nombre: nombre,
        total,
        negocio_id: idNegocio,
        canal_origen: manualPedido.canal_origen,
        contacto_cliente: manualPedido.contacto_cliente || null,
        notas_cliente: manualPedido.notas_cliente || null,
        tipo_entrega: manualPedido.tipo_entrega,
        entrega_detalle: manualPedido.tipo_entrega === 'Envio' && manualPedido.direccion
          ? JSON.stringify({ direccion: manualPedido.direccion })
          : null,
        productos: []
      };

      await axios.post('/pedidos-digitales', payload);
      await fetchPedidosDigitales();
      await fetchHistorialPedidosDigitales();
      setTab('digital');
      setDigitalView('activos');
      setManualPedido({
        cliente_nombre: "",
        total: "",
        canal_origen: "WhatsApp",
        contacto_cliente: "",
        notas_cliente: "",
        tipo_entrega: "Recoger",
        direccion: ""
      });

      Swal.fire({
        title: 'Pedido registrado',
        text: 'Se agregó a pedidos online activos para preparación.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (e) {
      Swal.fire('Error', 'No se pudo registrar el pedido de redes.', 'error');
    }
  };

  useEffect(() => {
    fetchPedidosDigitales();
    fetchHistorialPedidosDigitales();
    fetchTicketResources();
    const interval = setInterval(() => {
      fetchPedidosDigitales();
      fetchHistorialPedidosDigitales();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-green-900 mb-6">Pedidos</h1>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setTab("redes")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "redes" ? "bg-green-700 text-white shadow-lg shadow-green-100" : "bg-white border-2 border-gray-100 text-gray-600"}`}
        >
          <FaWhatsapp /> Pedidos por Redes
        </button>
        <button
          onClick={() => setTab("digital")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all relative ${tab === "digital" ? "bg-pink-600 text-white shadow-lg shadow-pink-100" : "bg-white border-2 border-gray-100 text-gray-600"}`}
        >
          <FaMobileAlt /> Pedidos Online
          {pedidosDigitales.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">{pedidosDigitales.length}</span>
          )}
        </button>
      </div>

      {/* Tab: Registro Manual por Redes */}
      {tab === "redes" && (
        <div className="bg-white rounded-2xl border border-green-100 p-5 md:p-6 space-y-4 shadow-sm">
          <h3 className="text-lg font-black text-green-900">Registro Rápido de Pedido (WhatsApp/Facebook/Llamada)</h3>
          <p className="text-sm text-gray-500">Para clientes que no usan menú digital. Se agregan directo a Pedidos Online activos.</p>

          <div className="grid md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nombre del cliente"
              className="w-full border border-gray-200 rounded-xl px-4 py-3"
              value={manualPedido.cliente_nombre}
              onChange={(e) => setManualPedido((prev) => ({ ...prev, cliente_nombre: e.target.value }))}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Total del pedido"
              className="w-full border border-gray-200 rounded-xl px-4 py-3"
              value={manualPedido.total}
              onChange={(e) => setManualPedido((prev) => ({ ...prev, total: e.target.value }))}
            />

            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-3"
              value={manualPedido.canal_origen}
              onChange={(e) => setManualPedido((prev) => ({ ...prev, canal_origen: e.target.value }))}
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Llamada">Llamada</option>
              <option value="Mostrador">Mostrador</option>
              <option value="Otro">Otro</option>
            </select>

            <input
              type="text"
              placeholder="Teléfono o contacto"
              className="w-full border border-gray-200 rounded-xl px-4 py-3"
              value={manualPedido.contacto_cliente}
              onChange={(e) => setManualPedido((prev) => ({ ...prev, contacto_cliente: e.target.value }))}
            />

            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-3"
              value={manualPedido.tipo_entrega}
              onChange={(e) => setManualPedido((prev) => ({ ...prev, tipo_entrega: e.target.value }))}
            >
              <option value="Recoger">Recoge en sucursal</option>
              <option value="Envio">Envío a domicilio</option>
            </select>

            <input
              type="text"
              placeholder="Dirección (si es envío)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3"
              value={manualPedido.direccion}
              onChange={(e) => setManualPedido((prev) => ({ ...prev, direccion: e.target.value }))}
              disabled={manualPedido.tipo_entrega !== 'Envio'}
            />
          </div>

          <textarea
            placeholder="Notas del pedido (productos, indicaciones, etc.)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 min-h-24"
            value={manualPedido.notas_cliente}
            onChange={(e) => setManualPedido((prev) => ({ ...prev, notas_cliente: e.target.value }))}
          />

          <div className="flex justify-end">
            <button
              onClick={registrarPedidoRedes}
              className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3 rounded-xl"
            >
              + Registrar en Pedidos Online
            </button>
          </div>
        </div>
      )}

      {/* Tab: Pedidos Online del Menú Digital */}
      {tab === "digital" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setDigitalView("activos")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${digitalView === "activos" ? "bg-pink-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              Activos ({pedidosDigitales.length})
            </button>
            <button
              onClick={() => setDigitalView("historial")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${digitalView === "historial" ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              Historial Online ({pedidosDigitalesHistorial.length})
            </button>
          </div>

          {digitalView === "activos" && pedidosDigitales.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-6xl">📱</span>
              <p className="text-gray-400 mt-4 font-semibold">Sin pedidos online pendientes</p>
              <p className="text-gray-300 text-sm mt-1">Se actualizan automáticamente cada 10 segundos</p>
            </div>
          ) : digitalView === "activos" ? pedidosDigitales.map((p) => {
            const entrega = parseEntregaDetalle(p.entrega_detalle);
            const esEnvio = p.tipo_entrega === "Envio";
            const estaEnPreparacion = isPreparacionStatus(p.status);
            const tieneUbicacion = p.entrega_lat && p.entrega_lng;
            const mapsUrl = tieneUbicacion
              ? `https://www.google.com/maps?q=${p.entrega_lat},${p.entrega_lng}`
              : null;

            return (
            <div key={p.id} className="bg-white border-2 border-pink-100 rounded-2xl p-5 flex justify-between items-center shadow-sm hover:shadow-md transition-all gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-pink-100 text-pink-700 text-xs py-1 px-3 rounded-full font-bold uppercase tracking-widest">Online</span>
                  <span className="text-gray-400 text-xs">{new Date(p.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={`text-[10px] py-1 px-2 rounded-full font-black uppercase tracking-wider ${estaEnPreparacion ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                    {estaEnPreparacion ? 'En preparación' : (p.status || 'Pendiente')}
                  </span>
                </div>
                <p className="font-black text-gray-900 text-lg">{p.cliente_nombre}</p>
                <p className="text-green-700 font-extrabold">Total: ${parseFloat(p.total).toFixed(2)}</p>
                <p className="text-xs font-bold text-pink-600 mt-1">Canal: {p.canal_origen || 'Menu Digital'}</p>
                {p.contacto_cliente && <p className="text-xs text-gray-600">Contacto: {p.contacto_cliente}</p>}
                {p.notas_cliente && <p className="text-xs text-gray-600 mt-1">Notas: {p.notas_cliente}</p>}

                <div className="mt-3 text-xs text-gray-600 space-y-1">
                  <p className="font-bold text-gray-700">
                    Tipo: {esEnvio ? 'Envío a domicilio' : 'Recoge en sucursal'}
                  </p>
                  {esEnvio && (
                    <>
                      {entrega?.direccion && <p><span className="font-bold">Dirección:</span> {entrega.direccion}</p>}
                      {(entrega?.calle || entrega?.numeroCasa) && (
                        <p>
                          <span className="font-bold">Calle/Número:</span> {entrega?.calle || '-'} {entrega?.numeroCasa ? `#${entrega.numeroCasa}` : ''}
                        </p>
                      )}
                      {entrega?.referencia && <p><span className="font-bold">Referencia:</span> {entrega.referencia}</p>}
                      {entrega?.telefono && <p><span className="font-bold">Teléfono:</span> {entrega.telefono}</p>}
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-1 text-pink-600 font-bold hover:text-pink-700 underline"
                        >
                          Ver ubicación en mapa
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {!estaEnPreparacion ? (
                  <button onClick={() => marcarPedidoEnPreparacion(p.id)} className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap">
                    <FaCheckCircle /> En preparación
                  </button>
                ) : (
                  <button onClick={() => marcarPedidoPreparado(p.id)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap">
                    <FaCheckCircle /> Preparado
                  </button>
                )}
                <button onClick={() => rechazarPedidoDigital(p.id)} className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-3 rounded-xl font-bold transition-all">
                  <ImCancelCircle />
                </button>
              </div>
            </div>
          )}) : pedidosDigitalesHistorial.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
              <p className="text-gray-500 font-semibold">Sin historial online todavía.</p>
            </div>
          ) : pedidosDigitalesHistorial.map((p) => {
            const entrega = parseEntregaDetalle(p.entrega_detalle);
            const esEnvio = p.tipo_entrega === "Envio";
            const fueConfirmado = (p.status || '').toLowerCase() === 'confirmado';
            const tieneUbicacion = p.entrega_lat && p.entrega_lng;
            const mapsUrl = tieneUbicacion
              ? `https://www.google.com/maps?q=${p.entrega_lat},${p.entrega_lng}`
              : null;

            return (
              <div key={`hist-${p.id}`} className="bg-white border rounded-2xl p-5 flex justify-between items-start shadow-sm gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs py-1 px-3 rounded-full font-bold uppercase tracking-widest ${fueConfirmado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {p.status}
                    </span>
                    <span className="text-gray-400 text-xs">{new Date(p.created_at).toLocaleString('es-MX')}</span>
                  </div>
                  <p className="font-black text-gray-900 text-lg">{p.cliente_nombre}</p>
                  <p className="text-gray-700 font-extrabold">Total: ${parseFloat(p.total).toFixed(2)}</p>
                  <p className="text-xs font-bold text-pink-600 mt-1">Canal: {p.canal_origen || 'Menu Digital'}</p>
                  {p.contacto_cliente && <p className="text-xs text-gray-600">Contacto: {p.contacto_cliente}</p>}
                  {p.notas_cliente && <p className="text-xs text-gray-600 mt-1">Notas: {p.notas_cliente}</p>}

                  <div className="mt-3 text-xs text-gray-600 space-y-1">
                    <p className="font-bold text-gray-700">Tipo: {esEnvio ? 'Envío a domicilio' : 'Recoge en sucursal'}</p>
                    {esEnvio && (
                      <>
                        {entrega?.direccion && <p><span className="font-bold">Dirección:</span> {entrega.direccion}</p>}
                        {(entrega?.calle || entrega?.numeroCasa) && (
                          <p>
                            <span className="font-bold">Calle/Número:</span> {entrega?.calle || '-'} {entrega?.numeroCasa ? `#${entrega.numeroCasa}` : ''}
                          </p>
                        )}
                        {entrega?.referencia && <p><span className="font-bold">Referencia:</span> {entrega.referencia}</p>}
                        {entrega?.telefono && <p><span className="font-bold">Teléfono:</span> {entrega.telefono}</p>}
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-1 text-pink-600 font-bold hover:text-pink-700 underline"
                          >
                            Ver ubicación en mapa
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="hidden">
        <TicketPrint
          ref={componentRef}
          venta={{ metodo_pago: 'Online' }}
          seleccionados={buildTicketLines(ticketPedido)}
          total={Number(ticketPedido?.total || 0).toFixed(2)}
          negocio={negocioInfo || negocioSeleccionado || {}}
          config={ticketConfig || {}}
        />
      </div>
    </div>
  );
};

export default Pedidos;

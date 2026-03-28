import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useInventario } from "../context/InventarioContext";
import { useToppings } from "../context/ToppingsContext";
import axios from "../api/axios";
import { FaShoppingBag, FaTimes, FaPlus, FaStore, FaCheckCircle, FaHeart, FaTrash } from "react-icons/fa";
import { GiStrawberry } from "react-icons/gi";
import Swal from "sweetalert2";
import { buildAssetUrl } from "../utils/assets";

const MenuDigital = () => {
  const { id_negocio } = useParams();
  const { inventario, getValorid } = useInventario();
  const { toppings, getToppings } = useToppings();
  const [carrito, setCarrito] = useState([]);
  const [showToppings, setShowToppings] = useState(false);
  const [showResumenPedido, setShowResumenPedido] = useState(false);
  const [tempProducto, setTempProducto] = useState(null);
  const [tempToppings, setTempToppings] = useState([]);
  const [nombre, setNombre] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    direccion: "",
    calle: "",
    numeroCasa: "",
    referencia: "",
    telefono: "",
    lat: "",
    lng: ""
  });
  const [negocioInfo, setNegocioInfo] = useState(null);
  
  const negocioStorage = JSON.parse(localStorage.getItem("negocioSeleccionado") || "null");
  const actualId = id_negocio || JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;

  useEffect(() => {
    if (actualId) {
      getValorid(actualId);
      getToppings(actualId);
    }
  }, [actualId]);

  useEffect(() => {
    const obtenerNegocio = async () => {
      if (!actualId) {
        setNegocioInfo(null);
        return;
      }
      try {
        const res = await axios.get(`/negocio/${actualId}`);
        setNegocioInfo(res.data?.data || null);
      } catch (error) {
        setNegocioInfo(null);
      }
    };
    obtenerNegocio();
  }, [actualId]);

  const agregarAlCarrito = (producto) => {
    setTempProducto(producto);
    setTempToppings([]);
    setShowToppings(true);
  };

  const confirmarProducto = () => {
    const toppingTotal = tempToppings.reduce((acc, t) => acc + parseFloat(t.precio), 0);
    setCarrito([...carrito, {
      ...tempProducto,
      toppings: tempToppings,
      total: parseFloat(tempProducto.precio) + toppingTotal
    }]);
    setShowToppings(false);
  };

  const eliminarDelCarrito = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index));
    if (carrito.length === 1) setShowResumenPedido(false); // Cierra modal si se queda vacío
  };

  const enviarPedido = async () => {
    const nombreCliente = nombre.trim();
    if (!nombreCliente) return Swal.fire("Tu Nombre", "Por favor, dinos quién eres.", "info");
    if (carrito.length === 0) return Swal.fire("Oops", "Tu carrito está vacío.", "warning");

    if (showDeliveryForm) {
      if (!deliveryData.direccion.trim() || !deliveryData.calle.trim() || !deliveryData.numeroCasa.trim()) {
        return Swal.fire("Datos de envío", "Completa dirección, calle y número de casa para envío a domicilio.", "info");
      }
    }

    const infoEntrega = showDeliveryForm
      ? `
        <div style="margin-top:10px;padding:10px 12px;border-radius:12px;background:#fff1f2;border:1px solid #fecdd3;text-align:left;">
          <div style="font-size:13px;font-weight:800;color:#be123c;margin-bottom:4px;">Envío a domicilio</div>
          <div style="font-size:12px;color:#374151;"><b>Dirección:</b> ${deliveryData.direccion}</div>
          <div style="font-size:12px;color:#374151;"><b>Calle:</b> ${deliveryData.calle}</div>
          <div style="font-size:12px;color:#374151;"><b>Número:</b> ${deliveryData.numeroCasa}</div>
          ${deliveryData.referencia ? `<div style="font-size:12px;color:#374151;"><b>Referencia:</b> ${deliveryData.referencia}</div>` : ''}
          ${deliveryData.telefono ? `<div style="font-size:12px;color:#374151;"><b>Teléfono:</b> ${deliveryData.telefono}</div>` : ''}
          ${(deliveryData.lat && deliveryData.lng) ? `<div style="font-size:12px;color:#374151;"><b>Ubicación:</b> compartida automáticamente</div>` : ''}
        </div>
      `
      : `
        <div style="margin-top:10px;padding:10px 12px;border-radius:12px;background:#f9fafb;border:1px solid #e5e7eb;text-align:left;">
          <div style="font-size:13px;font-weight:800;color:#111827;">Entrega en sucursal</div>
        </div>
      `;

    const detalleItemsHtml = carrito
      .map((item, idx) => {
        const toppingsText = item.toppings?.length
          ? `<div style="font-size:12px;color:#6b7280;margin-top:4px;">Con: ${item.toppings.map((t) => t.nombre).join(', ')}</div>`
          : '';

        return `
          <div style="padding:10px 12px;border:1px solid #f3f4f6;border-radius:12px;margin-bottom:8px;text-align:left;">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
              <div style="font-weight:700;color:#111827;">1x ${idx + 1}. ${item.producto}</div>
              <div style="font-weight:800;color:#e11d48;">$${Number(item.total).toFixed(2)}</div>
            </div>
            ${toppingsText}
          </div>
        `;
      })
      .join('');

    const confirmacion = await Swal.fire({
      title: 'Confirma tu pedido',
      html: `
        <div style="text-align:left;max-height:300px;overflow:auto;padding-right:4px;">
          <div style="margin-bottom:10px;font-size:13px;color:#374151;"><b>Nombre:</b> ${nombreCliente}</div>
          ${infoEntrega}
          ${detalleItemsHtml}
        </div>
        <div style="margin-top:8px;padding-top:10px;border-top:1px dashed #d1d5db;font-size:16px;font-weight:900;color:#111827;">
          Total: $${totalPedido.toFixed(2)}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar y enviar',
      cancelButtonText: 'Seguir editando',
      confirmButtonColor: '#e11d48',
      reverseButtons: true
    });

    if (!confirmacion.isConfirmed) return;

    try {
      setIsSending(true);
      const pedidoData = {
        cliente_nombre: nombreCliente,
        total: carrito.reduce((acc, i) => acc + i.total, 0),
        negocio_id: actualId,
        tipo_entrega: showDeliveryForm ? 'Envio' : 'Recoger',
        entrega_detalle: showDeliveryForm
          ? JSON.stringify({
              direccion: deliveryData.direccion,
              calle: deliveryData.calle,
              numeroCasa: deliveryData.numeroCasa,
              referencia: deliveryData.referencia,
              telefono: deliveryData.telefono
            })
          : null,
        entrega_lat: deliveryData.lat ? Number(deliveryData.lat) : null,
        entrega_lng: deliveryData.lng ? Number(deliveryData.lng) : null,
        productos: carrito.map(i => ({
          producto_id: i.id,
          cantidad: 1,
          subtotal: i.total,
          metadata: JSON.stringify({ toppings: i.toppings.map(t => t.nombre) })
        }))
      };

      await axios.post("/pedidos-digitales", pedidoData);

      Swal.fire({
        title: "¡Gracias!",
        text: "Recibimos tu pedido.",
        icon: "success",
        confirmButtonColor: "#e11d48",
        timer: 3000,
        showClass: { popup: 'animate__animated animate__bounceIn' }
      });
      setShowResumenPedido(false);
      setCarrito([]);
      setNombre("");
      setShowDeliveryForm(false);
      setDeliveryData({
        direccion: "",
        calle: "",
        numeroCasa: "",
        referencia: "",
        telefono: "",
        lat: "",
        lng: ""
      });
    } catch (e) {
      Swal.fire("Error", "No se pudo enviar", "error");
    } finally {
      setIsSending(false);
    }
  };

  const abrirResumenPedido = () => {
    if (carrito.length === 0) {
      Swal.fire("Oops", "Tu carrito está vacío.", "warning");
      return;
    }
    setShowResumenPedido(true);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire('Ubicación no disponible', 'Tu navegador no soporta geolocalización.', 'warning');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setDeliveryData((prev) => ({ ...prev, lat, lng }));
      },
      () => {
        Swal.fire('No se pudo obtener ubicación', 'Activa permisos de ubicación para usar el mapa.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const productosVisibles = inventario.filter(p => p.activo === 1 && p.mostrar_en_menu === 1);
  const totalPedido = carrito.reduce((acc, i) => acc + i.total, 0);
  const nombreValido = nombre.trim().length > 0;
  const categorias = [...new Set(productosVisibles.map(p => p.categoria || 'General'))];
  
  const logoNegocio = negocioInfo?.logo || negocioInfo?.logo_url;
  const nombreBaseNegocio = negocioInfo?.nombre_comercial || negocioInfo?.nombre_marca || negocioStorage?.nombre_comercial || negocioStorage?.nombre || negocioInfo?.nombre || "PECADITO";
  const nombreNegocio = (nombreBaseNegocio || "PECADITO").replace(/\b(sucursal|branch)\b/gi, "").replace(/\s{2,}/g, " ").replace(/\s+\d+$/, "").trim() || "PECADITO";
  const esloganNegocio = negocioInfo?.eslogan || negocioStorage?.eslogan || "El postre más fresco";
  const floatingDecor = [
    { type: 'heart', left: '4%', top: '14%', size: 24, duration: 14, delay: 0 },
    { type: 'strawberry', left: '12%', top: '62%', size: 28, duration: 18, delay: 1.5 },
    { type: 'heart', left: '22%', top: '38%', size: 20, duration: 13, delay: 2.2 },
    { type: 'strawberry', left: '35%', top: '18%', size: 26, duration: 17, delay: 0.6 },
    { type: 'heart', left: '46%', top: '72%', size: 22, duration: 15, delay: 2.8 },
    { type: 'strawberry', left: '56%', top: '48%', size: 30, duration: 20, delay: 1.2 },
    { type: 'heart', left: '67%', top: '22%', size: 25, duration: 16, delay: 0.9 },
    { type: 'strawberry', left: '78%', top: '64%', size: 24, duration: 19, delay: 2.4 },
    { type: 'heart', left: '88%', top: '36%', size: 19, duration: 12, delay: 1.8 },
    { type: 'strawberry', left: '94%', top: '14%', size: 32, duration: 21, delay: 0.3 },
    { type: 'heart', left: '8%', top: '84%', size: 21, duration: 17, delay: 1.1 },
    { type: 'strawberry', left: '28%', top: '82%', size: 22, duration: 16, delay: 2.6 },
    { type: 'heart', left: '52%', top: '10%', size: 18, duration: 14, delay: 0.7 },
    { type: 'strawberry', left: '72%', top: '80%', size: 26, duration: 18, delay: 2.1 },
    { type: 'heart', left: '90%', top: '78%', size: 20, duration: 15, delay: 1.4 }
  ];

  return (
    <div className="min-h-screen bg-[#FDF8F9] relative overflow-x-hidden font-sans">
      
      {/* Decoración de fondo suave (optimizada para móviles) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-rose-100 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-pink-100 rounded-full blur-[80px] opacity-60"></div>
      </div>

      {/* Corazones y fresas flotantes */}
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
        {floatingDecor.map((item, idx) => (
          <div
            key={`${item.type}-${idx}`}
            className="floating-magic"
            style={{
              left: item.left,
              top: item.top,
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`
            }}
          >
            {item.type === 'heart' ? (
              <FaHeart
                size={item.size}
                className="text-rose-300/60 drop-shadow-[0_6px_14px_rgba(225,29,72,0.16)]"
              />
            ) : (
              <GiStrawberry
                size={item.size}
                className="text-pink-300/60 drop-shadow-[0_6px_14px_rgba(236,72,153,0.18)]"
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Header Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-rose-50 shadow-sm">
        <div className="w-full mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoNegocio ? (
              <img src={buildAssetUrl(logoNegocio)} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full border border-gray-100 shadow-sm" />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-500 flex items-center justify-center rounded-full shadow-sm">
                <FaStore className="text-white" size={18} />
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl font-black text-gray-900 leading-tight tracking-tight">
                {nombreNegocio}
              </h1>
              <p className="text-[10px] sm:text-xs text-rose-500 font-semibold uppercase tracking-wider">{esloganNegocio}</p>
            </div>
          </div>

          {/* Icono perfil o user (opcional) - mantenemos el layout balanceado */}
          <div className="w-10 h-10 flex items-center justify-center bg-rose-50 rounded-full text-rose-500">
             <FaHeart size={16} />
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="w-full mx-auto px-3 sm:px-4 lg:px-8 py-6 pb-32 relative z-10">
        
        {/* Banner Hero App-like */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-[34px] p-7 sm:p-10 mb-10 shadow-xl shadow-rose-200 relative overflow-hidden min-h-[150px] sm:min-h-[180px] flex items-center">
          <GiStrawberry className="absolute -top-6 right-10 text-white/10" size={100} />
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-2 leading-tight">¿Qué se te antoja hoy?</h2>
            <p className="text-rose-100 text-lg sm:text-2xl font-extrabold">Ordena fácil y rápido desde tu celular</p>
          </div>
        </div>

        {/* Categorías y Productos */}
        {categorias.map((cat) => (
          <section key={cat} className="mb-10">
            <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
              {cat}
              <span className="flex-1 h-px bg-gray-200 ml-4"></span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {productosVisibles.filter(p => (p.categoria || 'General') === cat).map((p) => (
                <div
                  key={p.id}
                  onClick={() => agregarAlCarrito(p)}
                  className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-gray-100 flex flex-col gap-2 active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
                    <img
                      src={buildAssetUrl(p.imagen)}
                      className="w-full h-full object-cover"
                      alt={p.producto}
                    />
                    <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                      <span className="text-xs sm:text-sm font-black text-gray-900">${p.precio}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between px-1">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 leading-tight line-clamp-2 mb-1">{p.producto}</h4>
                      <p className="text-[11px] text-gray-500 line-clamp-1 leading-snug">{p.presentacion}</p>
                    </div>
                    
                    <button className="mt-3 bg-rose-50 text-rose-600 w-full py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 transition-colors hover:bg-rose-500 hover:text-white">
                      <FaPlus size={10} /> Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Píldora Flotante del Carrito (UberEats Style) */}
      {carrito.length > 0 && !showResumenPedido && !showToppings && (
        <div className="fixed bottom-6 inset-x-0 flex justify-center z-[60] px-4 animate-in slide-in-from-bottom-10 duration-300">
          <button
            onClick={abrirResumenPedido}
            className="w-full max-w-sm bg-gray-900 text-white shadow-2xl shadow-gray-900/40 rounded-full p-1.5 pl-6 flex items-center justify-between active:scale-95 transition-transform"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{carrito.length} {carrito.length === 1 ? 'artículo' : 'artículos'}</span>
              <span className="font-black text-lg leading-tight">${totalPedido.toFixed(2)}</span>
            </div>
            <div className="bg-rose-500 hover:bg-rose-400 text-white rounded-full px-5 py-3.5 font-bold text-sm flex items-center gap-2 transition-colors">
              Ver pedido <FaShoppingBag size={14} />
            </div>
          </button>
        </div>
      )}

      {/* Modal Toppings (Bottom Sheet en móvil) */}
      {showToppings && (
        <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200"
          >
            {/* Grabber para móvil */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
            </div>

            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">{tempProducto?.producto}</h3>
                <p className="text-sm text-gray-500 mt-0.5">${tempProducto?.precio}</p>
              </div>
              <button onClick={() => setShowToppings(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200">
                <FaTimes size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {toppings.length > 0 ? (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Personaliza tu pedido
                  </h4>
                  <div className="flex flex-col gap-2">
                    {toppings.map(t => {
                      const isSelected = tempToppings.find(it => it.id === t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            if (isSelected) setTempToppings(tempToppings.filter(it => it.id !== t.id));
                            else setTempToppings([...tempToppings, t]);
                          }}
                          className={`p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors border ${
                            isSelected ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100 hover:border-rose-100'
                          }`}
                        >
                          <span className={`text-sm font-medium ${isSelected ? 'text-rose-900' : 'text-gray-700'}`}>{t.nombre}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-500">+${t.precio}</span>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-rose-500 border-rose-500' : 'bg-white border-gray-300'}`}>
                               {isSelected && <FaCheckCircle className="text-white" size={12} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Este producto no tiene personalizaciones.</p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-white border-t border-gray-100 pb-safe">
              <button
                onClick={confirmarProducto}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl transition-colors active:scale-[0.98] flex justify-center items-center gap-2 shadow-md shadow-rose-200"
              >
                Agregar <span className="font-normal mx-1">|</span> ${(parseFloat(tempProducto?.precio) + tempToppings.reduce((acc, t) => acc + parseFloat(t.precio), 0)).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resumen (Bottom Sheet en móvil) */}
      {showResumenPedido && (
        <div className="fixed inset-0 z-[110] flex justify-center items-end sm:items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200"
          >
            {/* Grabber */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
            </div>

            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
              <h3 className="text-xl font-black text-gray-900">Tu Pedido</h3>
              <button onClick={() => setShowResumenPedido(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200">
                <FaTimes size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 space-y-3">
              {carrito.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start justify-between gap-3">
                  <div className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md mt-0.5">1x</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{item.producto}</p>
                    {item.toppings?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Con: {item.toppings.map(t => t.nombre).join(", ")}
                      </p>
                    )}
                    <p className="text-sm font-black text-rose-500 mt-2">${Number(item.total).toFixed(2)}</p>
                  </div>
                  <button onClick={() => eliminarDelCarrito(idx)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors">
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-4">
                <label className="text-sm font-bold text-gray-800 block mb-2">¿A nombre de quién es la orden?</label>
                <input
                  type="text"
                  placeholder="Ej. María o Mesa 4"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-rose-500 rounded-xl px-4 py-3.5 text-sm outline-none transition-colors"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowDeliveryForm((prev) => !prev)}
                  className="mt-3 text-[11px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors"
                >
                  {showDeliveryForm ? 'Quitar envío a domicilio' : '¿Quieres envío a domicilio?'}
                </button>

                {showDeliveryForm && (
                  <div className="mt-4 space-y-3 bg-rose-50/60 border border-rose-100 rounded-2xl p-4">
                    <p className="text-[11px] font-black uppercase tracking-wider text-rose-600">Datos de envío</p>

                    <input
                      type="text"
                      placeholder="Dirección (colonia/zona)"
                      className="w-full bg-white border border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 text-sm outline-none"
                      value={deliveryData.direccion}
                      onChange={(e) => setDeliveryData((prev) => ({ ...prev, direccion: e.target.value }))}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Calle"
                        className="w-full bg-white border border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 text-sm outline-none"
                        value={deliveryData.calle}
                        onChange={(e) => setDeliveryData((prev) => ({ ...prev, calle: e.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Número casa/depto"
                        className="w-full bg-white border border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 text-sm outline-none"
                        value={deliveryData.numeroCasa}
                        onChange={(e) => setDeliveryData((prev) => ({ ...prev, numeroCasa: e.target.value }))}
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Referencia (portón, tienda, etc.)"
                      className="w-full bg-white border border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 text-sm outline-none"
                      value={deliveryData.referencia}
                      onChange={(e) => setDeliveryData((prev) => ({ ...prev, referencia: e.target.value }))}
                    />

                    <input
                      type="text"
                      placeholder="Número de contacto"
                      className="w-full bg-white border border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 text-sm outline-none"
                      value={deliveryData.telefono}
                      onChange={(e) => setDeliveryData((prev) => ({ ...prev, telefono: e.target.value }))}
                    />

                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      className="w-full bg-white border border-rose-200 hover:border-rose-300 text-rose-600 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
                    >
                      Compartir mi ubicación (opcional)
                    </button>

                    <p className="text-[11px] text-rose-600/80 font-semibold">
                      No necesitas escribir coordenadas. Solo usa el botón si quieres que el repartidor te ubique más fácil.
                    </p>

                    {(deliveryData.lat && deliveryData.lng) && (
                      <div className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-[11px] font-bold text-rose-700">
                        Ubicación capturada correctamente.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 pb-safe">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-medium">Total a pagar</span>
                <span className="text-2xl font-black text-gray-900">${totalPedido.toFixed(2)}</span>
              </div>
              <button
                onClick={enviarPedido}
                disabled={!nombreValido || isSending}
                className={`w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-base ${
                  nombreValido && !isSending
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSending ? 'Enviando...' : 'Enviar Pedido'} <FaShoppingBag size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manejo de áreas seguras en iOS para la barra flotante */}
      <style dangerouslySetInnerHTML={{__html: `
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
        .floating-magic {
          position: absolute;
          transform: translate3d(0, 0, 0);
          animation-name: floatMagic;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          filter: saturate(1.1);
        }
        @keyframes floatMagic {
          0% { transform: translate3d(0, 0, 0) scale(0.95) rotate(-4deg); opacity: 0.25; }
          25% { transform: translate3d(10px, -22px, 0) scale(1.05) rotate(4deg); opacity: 0.52; }
          50% { transform: translate3d(-6px, -38px, 0) scale(1) rotate(-3deg); opacity: 0.32; }
          75% { transform: translate3d(-12px, -20px, 0) scale(1.06) rotate(2deg); opacity: 0.55; }
          100% { transform: translate3d(0, 0, 0) scale(0.95) rotate(-4deg); opacity: 0.25; }
        }
        @media (prefers-reduced-motion: reduce) {
          .floating-magic {
            animation: none;
            opacity: 0.24;
          }
        }
      `}} />
    </div>
  );
};

export default MenuDigital;
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useInventario } from "../context/InventarioContext";
import { useToppings } from "../context/ToppingsContext";
import axios from "../api/axios";
import { FaShoppingBag, FaTimes, FaPlus, FaStore, FaCheckCircle, FaHeart, FaTrash, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { GiStrawberry } from "react-icons/gi";
import Swal from "sweetalert2";
import { buildAssetUrl } from "../utils/assets";

const MenuDigital = () => {
  const { id_negocio } = useParams();
  const { inventario, getValorid, promociones, getPromociones } = useInventario();
  const { toppings, getToppings } = useToppings();
  const [carrito, setCarrito] = useState([]);
  const [showToppings, setShowToppings] = useState(false);
  const [showResumenPedido, setShowResumenPedido] = useState(false);
  const [tempProducto, setTempProducto] = useState(null);
  const [tempToppings, setTempToppings] = useState([]);
  const [tempToppingsFijos, setTempToppingsFijos] = useState([]);
  
  // Filtros para el modal de toppings
  const [filtroToppingNombre, setFiltroToppingNombre] = useState("");
  const [filtroToppingCategoria, setFiltroToppingCategoria] = useState("Todas");
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
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [activeFlyingParticles, setActiveFlyingParticles] = useState([]);
  const [showDetalleProducto, setShowDetalleProducto] = useState(false);
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [cartAnimate, setCartAnimate] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [metodoPago, setMetodoPago] = useState("Efectivo"); // "Efectivo" | "Transferencia"
  const [bancoInfo, setBancoInfo] = useState(null);
  const [menuActivo, setMenuActivo] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [horarios, setHorarios] = useState(null);
  const [mensajeEspecial, setMensajeEspecial] = useState("");

  const triggerFlyEffect = (e) => {
    if (!e) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    // Target is the cart button at bottom center
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight - 80;

    const id = Date.now() + Math.random();
    const particle = { id, startX, startY, targetX, targetY, type: Math.random() > 0.5 ? 'heart' : 'strawberry' };

    setActiveFlyingParticles(prev => [...prev, particle]);
    setTimeout(() => {
      setActiveFlyingParticles(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };
  const carouselRef = useRef(null);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  const productosVisibles = inventario.filter(p => p.activo === 1 && p.mostrar_en_menu === 1);
  const totalPedido = carrito.reduce((acc, i) => acc + i.total, 0);
  const nombreValido = nombre.trim().length > 0;
  const categorias = [...new Set(productosVisibles.map(p => p.categoria || 'General'))];

  // Lógica Híbrida de Imperdibles: Manual (destacado) + Automático (vendedores)
  const productosImperdibles = [...productosVisibles]
    .sort((a, b) => {
      const aDest = a.destacado || a.favorito || 0;
      const bDest = b.destacado || b.favorito || 0;
      if (aDest !== bDest) return bDest - aDest;

      const aVentas = a.ventas_totales || a.total_ventas || 0;
      const bVentas = b.ventas_totales || b.total_ventas || 0;
      return bVentas - aVentas;
    })
    .slice(0, 6);

  useEffect(() => {
    const destacadosCount = productosImperdibles.length;
    if (destacadosCount > 1) {
      const timer = setInterval(() => {
        setCurrentPromoIndex((prev) => (prev + 1) % destacadosCount);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [productosVisibles.length]);

  useEffect(() => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const width = container.offsetWidth;
      let itemWidth;

      // Cálculo preciso según resolución para que el auto-scroll sea exacto
      if (window.innerWidth >= 1024) {
        itemWidth = (width - 32) / 3; // 3 ítems en PC (considerando gaps)
      } else if (window.innerWidth >= 640) {
        itemWidth = (width - 16) / 2; // 2 ítems en Tablet
      } else {
        itemWidth = width * 0.85; // Estilo móvil original
      }

      container.scrollTo({
        left: currentPromoIndex * (itemWidth + 16),
        behavior: 'smooth'
      });
    }
  }, [currentPromoIndex]);

  const negocioStorage = JSON.parse(localStorage.getItem("negocioSeleccionado"));
  const actualId = id_negocio || negocioStorage?.id;
  const lastUpdateRef = useRef(null);

    // Obtener datos de transferencia
    const obtenerBanco = async () => {
      if (!actualId) return;
      try {
        const res = await axios.get(`/configuraciones/${actualId}/transferencia`);
        setBancoInfo(res.data);
      } catch (e) {
        console.warn("No se cargaron datos bancarios");
      }
    };

    useEffect(() => {
      if (actualId) {
        const fetchData = () => {
          getValorid(actualId);
          getToppings(actualId);
          getPromociones(actualId);
          obtenerBanco();
          
          // Cargar configuración de tienda abierta/cerrada
          axios.get(`/configuraciones/${actualId}`)
            .then(res => {
              setMenuActivo(res.data.menu_activo === 1);
              if (res.data.horarios) {
                try {
                  setHorarios(JSON.parse(res.data.horarios));
                } catch (e) {
                  console.warn("Error parseando horarios en menu");
                }
              }
              setMensajeEspecial(res.data.mensaje_especial || "");
              setLoadingConfig(false);
            })
            .catch(() => setLoadingConfig(false));
        };

        const checkSync = async () => {
          try {
            const res = await axios.get(`/sync-token/${actualId}`);
            const serverUpdate = res.data.last_update;

            if (serverUpdate !== lastUpdateRef.current) {
              console.log(">>> Sincronización inteligente detectada: actualizando catálogo...");
              fetchData();
              lastUpdateRef.current = serverUpdate;
            }
          } catch (err) {
            console.warn("Error en chequeo de sinc:", err);
            // Fallback al sondeo normal si el token falla
            fetchData();
          }
        };

        // Carga inicial y chequeo inteligente
        checkSync();

        // Latido de Sincronización Inteligente (cada 10 segundos)
        const interval = setInterval(() => {
          checkSync();
        }, 10000);

        return () => clearInterval(interval);
      }
    }, [actualId]);

  // Detector de vigencia para promociones Pecadito
  const getActivePromo = (productoId) => {
    if (!promociones || promociones.length === 0) return null;
    const ahora = new Date();
    return promociones.find(promo =>
      promo.inventario_id === productoId &&
      new Date(promo.fecha_inicio) <= ahora &&
      new Date(promo.fecha_fin) >= ahora &&
      promo.estado === 1
    );
  };

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

  useEffect(() => {
    if (carrito.length > 0) {
      setCartAnimate(true);
      const timer = setTimeout(() => setCartAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [carrito.length]);

  const agregarAlCarrito = async (producto) => {
    // Buscar toppings fijos
    let fijos = [];
    try {
        const res = await axios.get(`/inventario/${producto.id}/toppings-fijos`);
        fijos = res.data;
    } catch (e) {
        console.error("Error al obtener toppings fijos");
    }

    setTempProducto({ ...producto, toppings_fijos: fijos });
    setTempToppings(fijos); // Marcamos fijos por defecto
    setTempToppingsFijos(fijos);
    setShowToppings(true);
  };

  const confirmarProducto = () => {
    const base = parseFloat(tempProducto.price_override || tempProducto.precio) || 0;
    
    // Separar Toppings por tipo (Premium, Fijos, Choices)
    const premium = tempToppings.filter(t => (t.categoria_nombre || "").toLowerCase().includes("premium"));
    const noPremium = tempToppings.filter(t => !(t.categoria_nombre || "").toLowerCase().includes("premium"));

    // Toppings fijos (receta base) son los UNICOS que pueden ser gratis
    const fijosIds = (tempProducto.toppings_fijos || []).map(tf => Number(tf.id));
    
    // Aplicar REGLA: Solo el primero de cada topping fijo es gratis. El resto son extra.
    const seenFijosIds = new Set();
    let extraCost = 0;

    const toppingsConPrecios = tempToppings.map(t => {
        const isPremium = (t.categoria_nombre || "").toLowerCase().includes("premium");
        const isFijo = fijosIds.includes(Number(t.id));
        let precioCobrar = 0;

        if (isPremium) {
            precioCobrar = parseFloat(t.precio) || 0;
        } else if (isFijo) {
            if (seenFijosIds.has(Number(t.id))) {
                precioCobrar = parseFloat(t.precio) || 0;
            } else {
                seenFijosIds.add(Number(t.id));
                precioCobrar = 0;
            }
        } else {
            precioCobrar = parseFloat(t.precio) || 0;
        }

        extraCost += precioCobrar;
        return { ...t, precio_final: precioCobrar };
    });

    setCarrito([...carrito, {
      ...tempProducto,
      toppings: toppingsConPrecios,
      total: base + extraCost
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
        })),
        metodo_pago: metodoPago
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

  const abrirDetalle = async (p) => {
    try {
        const res = await axios.get(`/inventario/${p.id}/toppings-fijos`);
        setProductoDetalle({ ...p, toppings_fijos: res.data });
    } catch (e) {
        setProductoDetalle(p);
    }
    setShowDetalleProducto(true);
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



  useEffect(() => {
    if (categorias.length > 0 && !categoriaSeleccionada) {
      setCategoriaSeleccionada(categorias[0]);
    } else if (categorias.length > 0 && !categorias.includes(categoriaSeleccionada)) {
      setCategoriaSeleccionada(categorias[0]);
    }
  }, [categorias, categoriaSeleccionada]);

  const logoNegocio = negocioInfo?.logo || negocioInfo?.logo_url;
  const isMatch = actualId == negocioStorage?.id;
  const nombreBaseNegocio = negocioInfo?.nombre_comercial || negocioInfo?.nombre_marca || (isMatch ? (negocioStorage?.nombre_comercial || negocioStorage?.nombre) : null) || negocioInfo?.nombre || "PECADITO";
  const nombreNegocio = (nombreBaseNegocio || "PECADITO").replace(/\b(sucursal|branch)\b/gi, "").replace(/\s{2,}/g, " ").replace(/\s+\d+$/, "").trim() || "PECADITO";
  const esloganNegocio = negocioInfo?.eslogan || (isMatch ? negocioStorage?.eslogan : null) || "El postre más fresco";
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
      <main className="w-full mx-auto pb-32 relative z-10">

        {/* Banner Hero FULL BLEED (Cubre todo el ancho) */}
        <div className="w-full bg-gradient-to-br from-rose-500 to-pink-500 p-8 sm:p-12 mb-8 sm:mb-10 shadow-xl shadow-rose-200/40 relative overflow-hidden flex items-center min-h-[180px] sm:min-h-[260px]">
          <GiStrawberry className="absolute -bottom-10 -right-10 text-white/10 rotate-12" size={240} />
          <GiStrawberry className="absolute -top-10 -left-10 text-white/5 -rotate-12" size={180} />
          <div className="relative z-10 max-w-[90%] sm:max-w-[70%]">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-3 leading-[1.1] tracking-tight">
              ¿Qué se te <br className="sm:hidden" /> antoja hoy?
            </h2>
            <p className="text-rose-100 text-xs sm:text-lg lg:text-xl font-black uppercase tracking-[0.3em] opacity-90">
              Ordena fácil desde tu celular
            </p>
          </div>
        </div>

        {/* Buscador Inteligente - Diseño Flotante */}
        <div className="px-3 sm:px-4 lg:px-8 -mt-6 mb-8 relative z-20">
          <div className="relative group max-w-2xl mx-auto">
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
            <input
              type="text"
              placeholder="¿Qué quieres probar hoy? Buscar frapes, postres..."
              className="w-full bg-white border-0 shadow-2xl shadow-rose-100/50 rounded-[2rem] py-5 pl-14 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-200 transition-all placeholder:text-gray-300 placeholder:italic"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-50 p-2 rounded-full text-gray-400 hover:text-rose-500 transition-colors"
                title="Limpiar búsqueda"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Carrusel de "Imperdibles" - Solo visible si no hay búsqueda activa */}
        {!busqueda && productosImperdibles.length > 0 && (
          <div className="mb-10 animate-in slide-in-from-right duration-700">
            <div className="px-3 sm:px-4 lg:px-8 flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Los Imperdibles
              </h3>
            </div>

            <div className="relative group/carousel">
              {/* Botones de navegación para Desktop */}
              <button
                onClick={() => {
                  const items = productosImperdibles.length;
                  setCurrentPromoIndex(prev => (prev - 1 + items) % items);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-rose-500 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-rose-500 hover:text-white hidden lg:flex"
              >
                <FaChevronLeft size={20} />
              </button>

              <button
                onClick={() => {
                  const items = productosImperdibles.length;
                  setCurrentPromoIndex(prev => (prev + 1) % items);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-rose-500 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-rose-500 hover:text-white hidden lg:flex"
              >
                <FaChevronRight size={20} />
              </button>

              <div
                ref={carouselRef}
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth gap-4 px-6 pb-8"
              >
                {productosImperdibles.map((p) => {
                  const isAgotado = p.stock <= 0;
                  return (
                    <div
                      key={`promo-${p.id}`}
                      onClick={() => !isAgotado && abrirDetalle(p)}
                      className={`flex-shrink-0 w-[85vw] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] snap-center relative group cursor-pointer active:scale-95 transition-all duration-500 ${isAgotado ? 'opacity-70 grayscale pointer-events-none' : ''}`}
                    >
                      <div className="relative h-[200px] sm:h-[240px] lg:h-[280px] rounded-[3rem] overflow-hidden shadow-2xl shadow-rose-200/20 border-2 border-white group-hover:border-rose-200 transition-all">
                        <img
                          src={buildAssetUrl(p.imagen)}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] ease-out"
                          alt=""
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                        {isAgotado && (
                          <div className="absolute top-6 left-6 bg-red-600 text-white px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl z-20 animate-pulse">
                            Agotado
                          </div>
                        )}

                        <div className="absolute bottom-6 left-8 right-8 text-white">
                          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-300 mb-1">{p.presentacion || 'Delicia Premium'}</p>
                          <h4 className="text-xl sm:text-2xl font-black leading-tight line-clamp-1">{p.producto}</h4>
                        </div>
                        <div className="absolute top-6 right-6 bg-rose-500 px-4 py-2 rounded-2xl shadow-xl">
                          <span className="text-sm font-black text-white tracking-widest">${p.precio}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Vitrina Dinámica de Promociones (Pecadito Campaigns) */}
        {!busqueda && productosVisibles.some(p => getActivePromo(p.id)) && (
          <div className="px-3 sm:px-4 lg:px-8 mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-200">
                  <FaShoppingBag size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800">Ofertas del Momento</h3>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Aprovecha antes de que se agoten</p>
                </div>
              </div>
              <div className="flex -space-x-3">
                {productosVisibles.filter(p => getActivePromo(p.id)).slice(0, 3).map((p, idx) => (
                  <div key={idx} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-lg transform hover:scale-110 transition-all cursor-pointer ring-2 ring-amber-50/50">
                    <img src={buildAssetUrl(p.imagen)} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>
            </div>

            {/* Lista Horizontal de Ofertas */}
            <div className="flex overflow-x-auto no-scrollbar gap-4 -mx-1 px-1 pb-4">
              {productosVisibles.filter(p => getActivePromo(p.id)).map((p) => {
                const promo = getActivePromo(p.id);
                const isAgotado = p.stock <= 0;
                return (
                  <div
                    key={`exclusive-promo-${p.id}`}
                    onClick={() => !isAgotado && abrirDetalle(p)}
                    className={`flex-shrink-0 w-[70vw] sm:w-[300px] bg-white rounded-[2.5rem] p-4 shadow-xl shadow-amber-100/30 border border-amber-50 relative group cursor-pointer active:scale-95 transition-all ${isAgotado ? 'opacity-70 grayscale pointer-events-none' : ''}`}
                  >
                    <div className="relative h-40 rounded-[2rem] overflow-hidden mb-4 shadow-inner">
                      <img src={buildAssetUrl(p.imagen)} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="" />
                      <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter shadow-lg shadow-amber-200/50 animate-bounce">
                        {promo.tipo === '2x1' ? '2x1 Hoy' : promo.titulo_promo}
                      </div>
                    </div>
                    <div className="px-2">
                      <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1">{p.presentacion || 'Tradicional'}</p>
                      <h4 className="text-md font-black text-gray-900 line-clamp-1 mb-2">{p.producto}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-rose-500 tracking-tighter leading-none">
                          ${promo.tipo === 'precio_fijo' ? promo.valor : (p.precio * (1 - (promo.valor / 100))).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-300 line-through font-bold italic leading-none">
                          ${p.precio}
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-rose-500 shadow-lg group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
                      <FaPlus size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contenedor del Menú con márgenes laterales */}
        <div className="px-3 sm:px-4 lg:px-8">
          {/* Navegación por Categorías (Tabs) - Se oculta en búsqueda */}
          {!busqueda ? (
            <div className="sticky top-[64px] sm:top-[72px] z-40 -mx-3 sm:-mx-4 lg:-mx-8 px-3 sm:px-4 lg:px-8 py-4 bg-[#FDF8F9]/90 backdrop-blur-md overflow-x-auto no-scrollbar flex items-center gap-2.5 mb-8">
              {categorias.map((cat) => {
                const isSelected = categoriaSeleccionada === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSeleccionada(cat)}
                    className={`whitespace-nowrap px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all transform flex items-center gap-2 ${isSelected
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 -translate-y-0.5'
                        : 'bg-white text-gray-400 border border-gray-100 hover:bg-rose-50 hover:text-rose-400 active:scale-95'
                      }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                    {cat}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mb-8">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">
                Resultados para: <span className="text-rose-500">"{busqueda}"</span>
              </h3>
            </div>
          )}

          {/* Listado de Productos Filtrados */}
          <div
            key={busqueda ? 'search-results' : categoriaSeleccionada}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {productosVisibles
                .filter(p => !busqueda ? (p.categoria || 'General') === categoriaSeleccionada : true)
                .filter(p =>
                  p.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
                  (p.presentacion || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                  (p.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
                )
                .map((p) => {
                  const isAgotado = p.stock <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => abrirDetalle(p)}
                      className={`group bg-white rounded-[2.8rem] p-3 shadow-2xl shadow-rose-100/10 border border-white flex flex-col gap-3 active:scale-95 transition-all cursor-pointer relative ${isAgotado ? 'opacity-75' : ''}`}
                    >
                      <div className="relative aspect-[4/5] rounded-[2.2rem] overflow-hidden bg-gray-50/50">
                        <img
                          src={buildAssetUrl(p.imagen)}
                          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out ${isAgotado ? 'grayscale' : ''}`}
                          alt={p.producto}
                        />
                        {isAgotado && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                            <span className="bg-white/90 text-red-600 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Agotado</span>
                          </div>
                        )}
                        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-gray-50/10 flex flex-col items-end">
                          {(() => {
                            const activePromo = getActivePromo(p.id);
                            if (activePromo) {
                              return (
                                <>
                                  <span className="text-[8px] text-gray-400 line-through decoration-rose-300 transform -translate-y-0.5 leading-none font-bold">
                                    ${p.precio}
                                  </span>
                                  <span className="text-[10px] sm:text-xs font-black text-rose-600 tracking-tighter leading-none">
                                    ${activePromo.tipo === 'precio_fijo' ? activePromo.valor : (p.precio * (1 - (activePromo.valor / 100))).toFixed(2)}
                                  </span>
                                </>
                              );
                            }
                            return <span className="text-[10px] sm:text-xs font-black text-gray-900 tracking-tighter leading-none">${p.precio}</span>;
                          })()}
                        </div>
                        {(() => {
                          const activePromo = getActivePromo(p.id);
                          if (activePromo) {
                            return (
                              <div className="absolute top-2.5 left-2.5 bg-amber-500 text-white px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-tighter shadow-lg shadow-amber-200/50 animate-bounce">
                                {activePromo.tipo === '2x1' ? '2x1 Hoy' : activePromo.titulo_promo}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      <div className="flex-1 flex flex-col px-1 pb-1 text-left">
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1.5 block line-clamp-1">{p.presentacion || 'Delicia'}</span>
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-tight mb-2 line-clamp-2 min-h-[2.4rem] sm:min-h-[2.8rem]">{p.producto}</h4>

                        <div className="mt-auto">
                          <button
                            disabled={isAgotado}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerFlyEffect(e);
                              agregarAlCarrito(p);
                            }}
                            className={`w-full py-4 rounded-[1.4rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-1.5 transition-all duration-300 ${isAgotado
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-rose-50/80 group-hover:bg-rose-500 text-rose-500 group-hover:text-white shadow-sm'
                              }`}
                          >
                            {isAgotado ? 'Cerrado' : <><FaPlus size={7} /> Agregar</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {productosVisibles.filter(p => (p.categoria || 'General') === categoriaSeleccionada).length === 0 && (
              <div className="py-24 text-center flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-300">
                  <FaStore size={40} />
                </div>
                <p className="text-gray-400 text-sm font-black uppercase tracking-[0.3em] italic">Próximamente...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Píldora Flotante del Carrito (UberEats Style) */}
      {carrito.length > 0 && !showResumenPedido && !showToppings && (
        <div className="fixed bottom-6 inset-x-0 flex justify-center z-[60] px-4 animate-in slide-in-from-bottom-10 duration-300">
          <button
            onClick={abrirResumenPedido}
            className={`w-full max-w-sm bg-gray-900 text-white shadow-2xl shadow-gray-900/40 rounded-full p-1.5 pl-6 flex items-center justify-between active:scale-95 transition-transform ${cartAnimate ? 'cart-pop' : ''}`}
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
              <button onClick={() => {
                setShowToppings(false);
                setFiltroToppingNombre("");
                setFiltroToppingCategoria("Todas");
              }} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200">
                <FaTimes size={16} />
              </button>
            </div>

            {/* BUSCADOR Y FILTROS DENTRO DEL MODAL */}
            <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-col gap-2">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                    <input 
                        type="text" 
                        placeholder="Buscar topping..." 
                        className="w-full bg-white border border-gray-100 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-rose-300 transition-all"
                        value={filtroToppingNombre}
                        onChange={(e) => setFiltroToppingNombre(e.target.value)}
                    />
                </div>
                <select 
                    className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-rose-300 transition-all"
                    value={filtroToppingCategoria}
                    onChange={(e) => setFiltroToppingCategoria(e.target.value)}
                >
                    <option value="Todas">Todas las categorías</option>
                    {[...new Set(toppings.map(t => t.categoria_nombre || "General"))].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              {toppings.length > 0 ? (
                <div className="space-y-6">
                  {/* Agrupación por Categorías con FILTRO APLICADO */}
                  {Object.entries(
                    toppings
                    .filter(t => {
                        const matchesNombre = t.nombre.toLowerCase().includes(filtroToppingNombre.toLowerCase());
                        const matchesCat = filtroToppingCategoria === "Todas" || (t.categoria_nombre || "General") === filtroToppingCategoria;
                        return matchesNombre && matchesCat;
                    })
                    .reduce((acc, t) => {
                      const cat = t.categoria_nombre || "General";
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(t);
                      return acc;
                    }, {})
                  ).map(([catNombre, lista]) => (
                    <div key={catNombre}>
                      <h4 className="text-[10px] font-black text-rose-300 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-300"></span> {catNombre}
                      </h4>
                      <div className="flex flex-col gap-2">
                        {lista.map(t => {
                          const isSelected = tempToppings.find(it => it.id === t.id);
                          const isFixed = tempToppingsFijos.some(tf => tf.id === t.id);
                          const isPremium = (t.categoria_nombre || "").toLowerCase().includes("premium");

                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                if (isFixed) return; // No se puede quitar un ingrediente base desde aqui si asi lo decide el negocio
                                if (isSelected) setTempToppings(tempToppings.filter(it => it.id !== t.id));
                                else setTempToppings([...tempToppings, t]);
                              }}
                              className={`p-3 sm:p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] border-2 ${isSelected ? (isFixed ? 'bg-green-50/30 border-green-500/50' : 'bg-rose-50/50 border-rose-500 shadow-sm') : 'bg-gray-50/50 border-transparent hover:border-rose-100'
                                } ${isFixed ? 'cursor-default' : ''}`}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-black ${isSelected ? (isFixed ? 'text-green-700' : 'text-rose-700') : 'text-gray-700'}`}>{t.nombre}</span>
                                  {isPremium && (
                                    <span className="bg-amber-100 text-amber-600 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Premium</span>
                                  )}
                                  {isFixed && (
                                    <span className="bg-green-100 text-green-600 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter italic">Base</span>
                                  )}
                                </div>
                                {parseFloat(t.precio) > 0 && !isFixed && (
                                  <span className="text-[10px] font-bold text-rose-300">
                                    {isPremium ? `$${t.precio} Siempre` : `+$${t.precio} extra`}
                                  </span>
                                )}
                              </div>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? (isFixed ? 'bg-green-500 border-green-500 shadow-md shadow-green-100' : 'bg-rose-500 border-rose-500 shadow-md shadow-rose-200') : 'bg-white border-gray-200'}`}>
                                {isSelected && (isFixed ? <FaCheckCircle className="text-white" size={12} /> : <FaCheckCircle className="text-white" size={12} />)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Este producto no tiene personalizaciones.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 pb-safe">
              <div className="flex flex-col gap-1 mb-4">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                  <span>Regla: Solo el 1ro de cada ingrediente base es gratis</span>
                  <span>Extras: ${(() => {
                    const fijosIds = (tempProducto?.toppings_fijos || []).map(tf => Number(tf.id));
                    const seenFijosIds = new Set();
                    let extra = 0;

                    tempToppings.forEach(t => {
                        const isPremium = (t.categoria_nombre || "").toLowerCase().includes("premium");
                        const isFijo = fijosIds.includes(Number(t.id));

                        if (isPremium) extra += (parseFloat(t.precio) || 0);
                        else if (isFijo) {
                            if (seenFijosIds.has(Number(t.id))) extra += (parseFloat(t.precio) || 0);
                            else seenFijosIds.add(Number(t.id));
                        } else {
                            extra += (parseFloat(t.precio) || 0);
                        }
                    });
                    return extra.toFixed(2);
                  })()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">Total Producto</span>
                  <span className="text-xl font-black text-rose-500">${(() => {
                    const base = parseFloat(tempProducto?.price_override || tempProducto?.precio) || 0;
                    const fijosIds = (tempProducto?.toppings_fijos || []).map(tf => Number(tf.id));
                    const seenFijosIds = new Set();
                    let extra = 0;

                    tempToppings.forEach(t => {
                        const isPremium = (t.categoria_nombre || "").toLowerCase().includes("premium");
                        const isFijo = fijosIds.includes(Number(t.id));

                        if (isPremium) extra += (parseFloat(t.precio) || 0);
                        else if (isFijo) {
                            if (seenFijosIds.has(Number(t.id))) extra += (parseFloat(t.precio) || 0);
                            else seenFijosIds.add(Number(t.id));
                        } else {
                            extra += (parseFloat(t.precio) || 0);
                        }
                    });
                    return (base + extra).toFixed(2);
                  })()}</span>
                </div>
              </div>
              <button
                onClick={confirmarProducto}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-5 rounded-[2rem] transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-xl shadow-rose-200 uppercase tracking-widest text-xs"
              >
                Confirmar Selección <FaShoppingBag size={14} />
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
                      <div className="mt-2 space-y-1 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                        {item.toppings.map((t, tIdx) => (
                           <div key={`${idx}-t-${tIdx}`} className="flex justify-between items-center text-[10px]">
                              <span className="text-gray-500 font-medium italic">+ {t.nombre}</span>
                              <span className="text-gray-700 font-bold">${(t.precio_final ?? t.precio).toFixed(2)}</span>
                           </div>
                        ))}
                      </div>
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

                <div className="mt-6 border-t border-gray-100 pt-5">
                  <label className="text-sm font-black text-gray-800 block mb-4 uppercase tracking-widest">¿Cómo quieres pagar?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMetodoPago("Efectivo")}
                      className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${metodoPago === "Efectivo" ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-md' : 'border-gray-100 bg-white text-gray-400 opacity-60'}`}
                    >
                      <span className="text-xl">💵</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Contra Entrega</span>
                    </button>
                    <button
                      onClick={() => setMetodoPago("Transferencia")}
                      className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${metodoPago === "Transferencia" ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-md' : 'border-gray-100 bg-white text-gray-400 opacity-60'}`}
                    >
                      <span className="text-xl">🏦</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Transferencia</span>
                    </button>
                  </div>

                  {metodoPago === "Transferencia" && (
                    <div className="mt-4 bg-blue-50/80 border border-blue-100 rounded-[2rem] p-5 shadow-sm animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                          <FaCheckCircle size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Datos Bancarios</p>
                          <p className="text-[11px] font-bold text-blue-800">Realiza tu pago y envía comprobante</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-white/60 rounded-xl p-3 border border-blue-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Banco</p>
                          <p className="text-sm font-black text-gray-800">{bancoInfo?.banco_nombre || "Cargando..."}</p>
                        </div>
                        <div className="bg-white/60 rounded-xl p-3 border border-blue-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Titular</p>
                          <p className="text-sm font-black text-gray-800">{bancoInfo?.banco_titular || "Cargando..."}</p>
                        </div>
                        {(bancoInfo?.banco_cuenta || bancoInfo?.banco_clabe) && (
                          <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-inner">
                            <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Cuenta / CLABE</p>
                            <p className="text-sm font-black text-gray-900 font-mono tracking-wider select-all cursor-pointer">
                              {bancoInfo?.banco_clabe || bancoInfo?.banco_cuenta}
                            </p>
                          </div>
                        )}
                        {bancoInfo?.banco_concepto && (
                          <p className="text-[10px] text-blue-700/70 font-bold italic text-center px-2">
                            Poner en concepto: <span className="text-blue-800">{bancoInfo.banco_concepto}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                className={`w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-base ${nombreValido && !isSending
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

      {/* Partículas voladoras mágicas (Fresas y Corazones) */}
      {activeFlyingParticles.map(p => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-[150] animate-magic-fly"
          style={{
            '--startX': `${p.startX}px`,
            '--startY': `${p.startY}px`,
            '--targetX': `${p.targetX}px`,
            '--targetY': `${p.targetY}px`
          }}
        >
          {p.type === 'heart' ? <FaHeart className="text-rose-500 text-2xl drop-shadow-2xl" /> : <GiStrawberry className="text-red-500 text-3xl drop-shadow-2xl" />}
        </div>
      ))}

      {/* Modal Ficha Detallada de Producto */}
      {showDetalleProducto && productoDetalle && (
        <div
          className="fixed inset-0 z-[120] flex justify-center items-end sm:items-center bg-black/60 backdrop-blur-md p-0 sm:p-4"
          onClick={() => setShowDetalleProducto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-xl rounded-t-[3.5rem] sm:rounded-[3.5rem] flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-500"
          >
            <div className="relative h-[40%] sm:h-[350px] w-full bg-gray-100">
              <img
                src={buildAssetUrl(productoDetalle.imagen)}
                className="w-full h-full object-cover"
                alt={productoDetalle.producto}
              />
              <button
                onClick={() => setShowDetalleProducto(false)}
                className="absolute top-6 right-6 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/40 transition-colors shadow-lg"
              >
                <FaTimes size={18} />
              </button>
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-6 bg-white text-left -mt-8 relative z-10">
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="text-2xl font-black text-gray-900 leading-tight flex-1">{productoDetalle.producto}</h3>
                <div className="flex flex-col items-end">
                  {(() => {
                    const activePromo = getActivePromo(productoDetalle.id);
                    if (activePromo) {
                      return (
                        <>
                          <span className="text-xs font-bold text-gray-300 line-through tracking-tighter leading-none mb-1 text-right block italic opacity-70">
                            ${productoDetalle.precio}
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter mb-1">
                              {activePromo.tipo === '2x1' ? '2x1 Hoy' : activePromo.titulo_promo}
                            </span>
                            <span className="text-2xl font-black text-rose-500 whitespace-nowrap leading-none tracking-tighter">
                              ${activePromo.tipo === 'precio_fijo' ? activePromo.valor : (productoDetalle.precio * (1 - (activePromo.valor / 100))).toFixed(2)}
                            </span>
                          </div>
                        </>
                      );
                    }
                    return <span className="text-xl font-black text-rose-500 whitespace-nowrap">${productoDetalle.precio}</span>;
                  })()}
                </div>


              </div>

              <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-6">
                {productoDetalle.presentacion || 'Tradicional'}
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Descripción</h4>
                  <p className="text-gray-500 text-base leading-relaxed font-medium">
                    {productoDetalle.descripcion || "Un deleite para tus sentidos. Preparado con nuestra receta secreta y los ingredientes más frescos para darte ese momento de felicidad que te mereces."}
                  </p>
                </div>

                {productoDetalle.toppings_fijos?.length > 0 && (
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Este producto incluye:</h4>
                   <div className="flex flex-wrap gap-2">
                     {productoDetalle.toppings_fijos.map(tf => (
                        <div key={`det-fijo-${tf.id}`} className="bg-rose-50/50 border border-rose-100/50 px-4 py-2 rounded-2xl flex items-center gap-2">
                           <FaCheckCircle className="text-rose-500" size={10} />
                           <span className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{tf.nombre}</span>
                        </div>
                     ))}
                   </div>
                </div>
                )}
              </div>
            </div>

            <div className="p-8 sm:p-10 bg-white border-t border-gray-50">
              <button
                disabled={productoDetalle.stock <= 0}
                onClick={(e) => {
                  triggerFlyEffect(e);
                  setTimeout(() => {
                    agregarAlCarrito(productoDetalle);
                    setShowDetalleProducto(false);
                  }, 300);
                }}
                className={`group w-full font-black py-5 rounded-[2rem] transition-all flex items-center justify-center gap-3 text-lg shadow-xl active:scale-95 ${productoDetalle.stock <= 0
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200'
                  }`}
              >
                {productoDetalle.stock <= 0
                  ? 'Producto Agotado'
                  : <>Agregar al Coche <FaShoppingBag size={20} className="group-hover:rotate-12 transition-transform" /></>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manejo de áreas seguras en iOS para la barra flotante */}
      {/* Pantalla de Tienda Cerrada (Seguridad Anti-Bromas) */}
      {!menuActivo && !loadingConfig && (
        <div className="fixed inset-0 z-[1000] bg-white/80 backdrop-blur-xl flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
           <div className="max-w-md space-y-6">
              <div className="w-24 h-24 bg-pink-100 rounded-[2.5rem] flex items-center justify-center text-pink-500 mx-auto shadow-xl shadow-pink-100/50 animate-bounce decoration-pink-500">
                <FaStore size={40} />
              </div>
              <div>
                <h2 className="text-4xl font-black text-pink-700 tracking-tighter uppercase mb-2">Pecadito en Pausa</h2>
                <p className="text-gray-500 font-bold italic tracking-tight italic">
                  Estamos preparando nuevas delicias para ti.<br/>
                  Nuestra tienda digital está cerrada por el momento.
                </p>
              </div>
              {/* Aviso Especial (Festivos/Eventos) */}
              {mensajeEspecial && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-4 shadow-sm">
                  <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest text-center leading-relaxed">
                    📢 {mensajeEspecial}
                  </p>
                </div>
              )}

              <div className="bg-pink-50 rounded-2xl p-5 border border-pink-100 shadow-inner">
                <p className="text-[10px] font-black uppercase text-pink-400 tracking-[0.2em] mb-4 text-center">🕒 Nuestros Horarios</p>
                <div className="space-y-3">
                  {(() => {
                    if (!horarios) return <p className="text-[10px] text-gray-400 text-center uppercase font-black">Cargando horarios...</p>;
                    
                    const dias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
                    let grouped = [];
                    let currentGroup = null;

                    dias.forEach((dia, index) => {
                      const data = horarios[dia];
                      const statusStr = data.abierto ? `${data.apertura} - ${data.cierre}` : 'Cerrado';
                      
                      if (currentGroup && currentGroup.status === statusStr) {
                        currentGroup.end = dia;
                      } else {
                        if (currentGroup) grouped.push(currentGroup);
                        currentGroup = { start: dia, end: dia, status: statusStr, abierto: data.abierto };
                      }
                      if (index === dias.length - 1) grouped.push(currentGroup);
                    });

                    return grouped.map((group, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/50 p-2 rounded-xl border border-white/50 shadow-sm">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                          {group.start === group.end ? group.start : `${group.start} a ${group.end}`}
                        </span>
                        <span className={`text-[11px] font-black tracking-tight ${group.abierto ? "text-pink-600" : "text-gray-300 italic"}`}>
                          {group.status}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">
                Consultas y Reservas: {negocioInfo?.telefono || 'Vía WhatsApp'}
              </p>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
        .cart-pop { animation: cartPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes cartPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
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
        @keyframes magicFly {
          0% { transform: translate(var(--startX), var(--startY)) scale(1) rotate(0deg); opacity: 1; }
          40% { transform: translate(calc(var(--startX) + (var(--targetX) - var(--startX)) * 0.4), calc(var(--startY) - 150px)) scale(1.8) rotate(45deg); opacity: 0.9; }
          100% { transform: translate(var(--targetX), var(--targetY)) scale(0.3) rotate(360deg); opacity: 0; }
        }
        .animate-magic-fly { 
          animation: magicFly 0.85s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards;
          left: 0;
          top: 0;
          position: fixed;
        }
      `}} />
    </div>
  );
};

export default MenuDigital;
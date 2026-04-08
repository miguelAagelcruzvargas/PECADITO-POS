import { useState, useEffect } from "react";
import { useInventario } from "../../context/InventarioContext";
import { useForm } from "react-hook-form";
import { useVentas } from "../../context/VentasContext";
import Swal from 'sweetalert2';
import { useToppings } from "../../context/ToppingsContext";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import TicketPrint from "./TicketPrint";
import { buildAssetUrl } from "../../utils/assets";
import axios from "../../api/axios";
import { FaTint, FaCookie, FaSeedling, FaBirthdayCake, FaCandyCane, FaCubes, FaHome, FaIceCream } from "react-icons/fa";

const ProductosConDetalle = () => {

  const [seleccionados, setSeleccionados] = useState([]);
  const [busquedaProductos, setBusquedaProductos] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toppingsModalOpen, setToppingsModalOpen] = useState(false);
  const [tempProducto, setTempProducto] = useState(null);
  const [tempToppings, setTempToppings] = useState([]);
  const [tempToppingsFijos, setTempToppingsFijos] = useState([]);
  const [config, setConfig] = useState(null);
  const [filtroCategoriaPos, setFiltroCategoriaPos] = useState("Todas");
  const [editingIndex, setEditingIndex] = useState(null);

  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const { inventario, getValorid } = useInventario();

  const { Crear } = useVentas();

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      metodo_pago: 'Efectivo',
      efectivo_recibido: ''
    }
  });

  const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;

  const totalPedido = seleccionados.reduce((acc, item) => acc + parseFloat(item.total), 0);
  const metodoPagoSeleccionado = watch('metodo_pago');
  const efectivoRecibido = Number(watch('efectivo_recibido') || 0);
  const cambio = metodoPagoSeleccionado === 'Efectivo' ? Math.max(0, efectivoRecibido - totalPedido) : 0;

  const construirDescripcionProducto = (item) => {
    const presentacion = (item.presentacion || "").toLowerCase();
    const nombre = item.producto || "Producto";

    if (presentacion.includes("1 kilo") || presentacion.includes("1kg")) {
      return `${item.cantidad} kg ${nombre}`;
    }

    if (presentacion.includes("1/2") || presentacion.includes("medio") || presentacion.includes("1/2 kilo")) {
      return `${item.cantidad} x 1/2 kg de ${nombre}`;
    }

    if (presentacion.includes("unitario") || presentacion.includes("pieza") || presentacion.includes("pza")) {
      return `${item.cantidad}x ${nombre}`;
    }

    if (item.presentacion) {
      return `${item.cantidad}x ${nombre} (${item.presentacion})`;
    }

    return `${item.cantidad}x ${nombre}`;
  };

  const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

  const renderToppingIcon = (categoria) => {
    const cat = (categoria || "").toUpperCase();
    if (cat.includes("LÍQUIDOS") || cat.includes("LIQUIDOS")) return <FaTint className="text-blue-400" />;
    if (cat.includes("GALLETAS")) return <FaCookie className="text-amber-700" />;
    if (cat.includes("SEMILLAS") || cat.includes("NUECES")) return <FaSeedling className="text-green-500" />;
    if (cat.includes("PASTELITOS")) return <FaBirthdayCake className="text-pink-400" />;
    if (cat.includes("CASEROS")) return <FaHome className="text-rose-400" />;
    if (cat.includes("CEREALES")) return <FaCubes className="text-amber-500" />;
    if (cat.includes("DULCES")) return <FaCandyCane className="text-red-400" />;
    return <FaIceCream className="text-pink-300" />;
  };

  const onsubmite = handleSubmit(async (data) => {
    if (seleccionados.length === 0) {
      Swal.fire("Sin productos", "Agrega al menos un producto para registrar la venta.", "warning");
      return;
    }

    if (!data.metodo_pago) {
      Swal.fire("Datos incompletos", "Selecciona metodo de pago.", "warning");
      return;
    }

    if (data.metodo_pago === 'Efectivo') {
      const recibido = Number(data.efectivo_recibido || 0);
      if (!Number.isFinite(recibido) || recibido <= 0) {
        Swal.fire("Falta monto", "Indica cuanto dinero entrego el cliente.", "warning");
        return;
      }
      if (recibido < totalPedido) {
        Swal.fire("Monto insuficiente", "El efectivo recibido es menor al total de la venta.", "warning");
        return;
      }
    }

    const datosCompletos = {
      ...data,
      id_cliente: data.id_cliente || null,
      total: totalPedido,
      id_negocio: id
    }

    const venta = {
      productos: seleccionados.map((item) => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario_final || item.precio,
        subtotal: item.total,
        topping_ids: (item.toppings || []).map((t) => t.id),
        id_negocio: id
      })),
    };

    await Crear(datosCompletos, venta);
    setModalOpen(false);

    const resumenPago = data.metodo_pago === 'Efectivo'
      ? `Total: $${totalPedido.toFixed(2)}\nRecibido: $${Number(data.efectivo_recibido).toFixed(2)}\nCambio: $${(Number(data.efectivo_recibido) - totalPedido).toFixed(2)}`
      : `Total: $${totalPedido.toFixed(2)}`;

    const respuesta = await Swal.fire({
      title: "Venta registrada",
      text: `${resumenPago}\n\nDeseas imprimir el ticket ahora?`,
      icon: "success",
      showCancelButton: true,
      confirmButtonText: "Imprimir ticket",
      cancelButtonText: "Cerrar",
      confirmButtonColor: "#2563eb"
    });

    if (respuesta.isConfirmed) {
      handlePrint();
    }

    setSeleccionados([]);
    reset();

  });

  const normalizarTexto = (value = "") =>
    value
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const productosFiltrados = inventario.filter((producto) => {
    if (Number(producto.activo) === 0) return false;
    const criterio = normalizarTexto(busquedaProductos);
    if (!criterio) return true;

    const textoProducto = `${producto.producto || ""} ${producto.presentacion || ""} ${producto.categoria || ""}`;
    return normalizarTexto(textoProducto).includes(criterio);
  });
  const productosActivos = inventario.filter((producto) => Number(producto.activo) !== 0);
  const totalSinStock = productosActivos.filter((p) => Number(p.stock || 0) <= 0).length;
  const totalStockBajo = productosActivos.filter((p) => {
    const stock = Number(p.stock || 0);
    return stock > 0 && stock <= 5;
  }).length;

  const obtenerFirmaToppings = (toppingsSeleccionados = []) =>
    toppingsSeleccionados
      .map((t) => Number(t.id))
      .sort((a, b) => a - b)
      .join("-");

  const agregarProductoConToppings = (producto, toppingsSeleccionados = [], indexToReplace = null) => {
    const base = Number(producto.precio) || 0;
    const fijosIds = (producto.toppings_fijos || []).map(tf => Number(tf.id));
    const seenFijosIds = new Set();
    let extraCost = 0;

    const toppingsConPrecios = toppingsSeleccionados.map(t => {
      const isPremium = (t.categoria_nombre || "").toLowerCase().includes("premium");
      const isFijo = fijosIds.includes(Number(t.id));
      let precioCobrar = 0;

      if (isPremium) {
        precioCobrar = Number(t.precio) || 0;
      } else if (isFijo) {
        if (seenFijosIds.has(Number(t.id))) {
          precioCobrar = Number(t.precio) || 0;
        } else {
          seenFijosIds.add(Number(t.id));
          precioCobrar = 0;
        }
      } else {
        precioCobrar = Number(t.precio) || 0;
      }

      extraCost += precioCobrar;
      return { ...t, precio_final: precioCobrar };
    });

    const precioUnitario = base + extraCost;
    const firmaToppings = obtenerFirmaToppings(toppingsSeleccionados);

    setSeleccionados((prev) => {
      // Caso 1: Actualizar una línea específica (Edición)
      if (indexToReplace !== null) {
        return prev.map((item, idx) =>
          idx === indexToReplace
            ? {
              ...item,
              toppings: toppingsConPrecios,
              firma_toppings: firmaToppings,
              precio_unitario_final: precioUnitario,
              total: item.cantidad * precioUnitario
            }
            : item
        );
      }

      // Caso 2: Sumar a una línea idéntica existente
      const indexExistente = prev.findIndex(
        (p) => p.id === producto.id && (p.firma_toppings || "") === firmaToppings
      );

      if (indexExistente >= 0) {
        return prev.map((p, idx) =>
          idx === indexExistente
            ? {
              ...p,
              cantidad: p.cantidad + 1,
              precio_unitario_final: precioUnitario,
              total: (p.cantidad + 1) * precioUnitario,
            }
            : p
        );
      }

      // Caso 3: Agregar como línea nueva
      return [
        ...prev,
        {
          ...producto,
          cantidad: 1,
          toppings: toppingsConPrecios,
          firma_toppings: firmaToppings,
          precio_unitario_final: precioUnitario,
          total: precioUnitario,
        },
      ];
    });
  };

  const validarStockDisponible = (producto) => {
    const stock = Number(producto?.stock || 0);
    if (stock > 0) return true;

    Swal.fire("Sin stock", `${producto?.producto || 'Este producto'} no tiene existencias por ahora.`, "warning");
    return false;
  };

  const agregarProductoDirecto = async (producto) => {
    if (!validarStockDisponible(producto)) return;

    // Obtener toppings fijos para incluirlos en la visualizacion
    let fijos = [];
    try {
      const res = await axios.get(`/inventario/${producto.id}/toppings-fijos`);
      fijos = res.data;
    } catch (e) {
      console.error("Error al obtener toppings fijos");
    }

    agregarProductoConToppings({ ...producto, toppings_fijos: fijos }, fijos);
  };

  const agregarProducto = async (producto) => {
    if (!validarStockDisponible(producto)) return;

    // Obtener toppings fijos para este producto
    let fijos = [];
    try {
      const res = await axios.get(`/inventario/${producto.id}/toppings-fijos`);
      fijos = res.data;
    } catch (e) {
      console.error("Error al obtener toppings fijos");
    }

    // Inteligencia: Si el ultimo item agregado es ESTE mismo producto y solo tiene 1 unidad, 
    // lo editamos automaticamente en lugar de agregar uno nuevo.
    const ultimoIdx = seleccionados.length - 1;
    if (ultimoIdx >= 0 && seleccionados[ultimoIdx].id === producto.id && seleccionados[ultimoIdx].cantidad === 1) {
      handleEditarToppings(seleccionados[ultimoIdx], ultimoIdx);
      return;
    }

    setTempProducto({ ...producto, toppings_fijos: fijos });
    setTempToppings(fijos); // Por defecto marcamos los fijos
    setTempToppingsFijos(fijos);
    setEditingIndex(null); // Asegurar que es alta nueva
    setToppingsModalOpen(true);
  };

  const confirmarProducto = () => {
    agregarProductoConToppings(tempProducto, tempToppings, editingIndex);

    setToppingsModalOpen(false);
    setTempProducto(null);
    setTempToppings([]);
    setTempToppingsFijos([]);
    setEditingIndex(null);
  };

  const handleEditarToppings = (item, index) => {
    setTempProducto(item);
    setTempToppings(item.toppings || []);
    setTempToppingsFijos(item.toppings_fijos || []);
    setEditingIndex(index);
    setToppingsModalOpen(true);
  };

  const cambiarCantidad = (index, delta) => {
    setSeleccionados((prev) => {
      const item = prev[index];
      if (!item) return prev;

      const precioUnitario = Number(item.precio_unitario_final) || Number(item.precio) || 0;
      const nuevaCantidad = Number(item.cantidad || 0) + delta;

      if (nuevaCantidad <= 0) {
        return prev.filter((_, idx) => idx !== index);
      }

      return prev.map((p, idx) =>
        idx === index
          ? {
            ...p,
            cantidad: nuevaCantidad,
            total: nuevaCantidad * precioUnitario,
          }
          : p
      );
    });
  };

  const { toppings, categorias } = useToppings();
  const [busquedaToppings, setBusquedaToppings] = useState("");

  // Agrupar toppings por categoría
  const toppingsAgrupados = toppings.reduce((acc, t) => {
    const cat = t.categoria_nombre || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const normalizarTopping = (t) => normalizarTexto(t.nombre);

  const filterToppings = (lista, catNombre) => {
    const criterio = normalizarTexto(busquedaToppings);
    const matchCat = filtroCategoriaPos === "Todas" || catNombre === filtroCategoriaPos;
    if (!matchCat) return [];
    if (!criterio) return lista;
    return lista.filter(t => normalizarTopping(t).includes(criterio));
  };

  useEffect(() => {
    getValorid();
    fetchConfig();
  }, [id]);

  const fetchConfig = async () => {
    if (!id) return;
    try {
      const res = await axios.get(`/configuraciones/${id}`);
      const data = res.data;
      setConfig(data);
    } catch (e) {
      console.error("Error al cargar config de ticket", e);
    }
  };

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 p-2 sm:p-4 lg:p-6 h-[calc(100dvh-88px)] bg-gray-50/30 overflow-hidden">
        {/* Tarjetas */}
        <div className="w-full xl:w-[62%] flex flex-col h-full overflow-hidden">
          <div className="mb-3">
            <input
              type="text"
              placeholder="Buscar producto por nombre, presentación o categoría..."
              className="w-full border border-green-400 rounded-lg px-4 py-2"
              value={busquedaProductos}
              onChange={(e) => setBusquedaProductos(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
            {productosFiltrados.map((producto) => (
              (() => {
                const stock = Number(producto.stock || 0);
                const sinStock = stock <= 0;
                const stockBajo = stock > 0 && stock <= 5;

                return (
                  <div
                    key={producto.id}
                    className={`border rounded-xl p-4 text-center transition-all flex flex-col justify-center ${sinStock ? 'bg-red-50 border-red-300' : 'bg-white hover:shadow-md'}`}
                  >
                    <img className="w-full" src={buildAssetUrl(producto.imagen)} alt={producto.producto} />
                    <p className="text-green-800 font-black text-3xl leading-none mt-2">
                      ${Number(producto.precio).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-gray-500 font-semibold">
                      {producto.presentacion || 'Presentacion general'}
                    </p>

                    <div className="mt-2">
                      {sinStock ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-600 text-white tracking-wider">
                          Sin stock
                        </span>
                      ) : stockBajo ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 tracking-wider border border-amber-300">
                          Stock bajo: {stock}
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700 tracking-wider border border-green-300">
                          Stock: {stock}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col 2xl:grid 2xl:grid-cols-2 gap-2">
                      <button
                        onClick={() => agregarProductoDirecto(producto)}
                        disabled={sinStock}
                        className={`text-xs font-black py-3 px-2 rounded-xl transition-all active:scale-95 ${sinStock ? 'bg-red-300 text-white cursor-not-allowed' : 'bg-green-700 hover:bg-green-800 text-white shadow-lg shadow-green-100'}`}
                      >
                        AGREGAR
                      </button>
                      <button
                        onClick={() => agregarProducto(producto)}
                        disabled={sinStock}
                        className={`text-xs font-black py-3 px-2 rounded-xl border-2 transition-all active:scale-95 ${sinStock ? 'bg-red-50 text-red-500 border-red-200 cursor-not-allowed' : 'bg-white hover:bg-green-50 text-green-700 border-green-400'}`}
                      >
                        + TOPPINGS
                      </button>
                    </div>
                  </div>
                );
              })()
            ))}

            {productosFiltrados.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-8 border border-dashed rounded-xl bg-white">
                No se encontraron productos con ese criterio.
              </div>
            )}
          </div>
        </div>

        {/* Detalles seleccionados */}
        <div className="w-full xl:w-[38%] border-2 border-green-100 rounded-[2rem] p-4 sm:p-5 lg:p-6 shadow-xl shadow-green-900/5 flex flex-col bg-white h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-green-900">Detalle de pedido</h2>
            {seleccionados.length > 0 && (
              <button
                onClick={() => setSeleccionados([])}
                className="text-xs font-bold uppercase tracking-wide text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                Limpiar
              </button>
            )}
          </div>

          {seleccionados.length === 0 ? (
            <div className="space-y-4">
              <p className="text-gray-500">Selecciona productos para ver el resumen</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-[11px] font-bold uppercase text-green-700">Activos</p>
                  <p className="text-2xl font-black text-green-900">{productosActivos.length}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-[11px] font-bold uppercase text-amber-700">Stock bajo</p>
                  <p className="text-2xl font-black text-amber-800">{totalStockBajo}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-[11px] font-bold uppercase text-red-700">Sin stock</p>
                  <p className="text-2xl font-black text-red-800">{totalSinStock}</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-700">Tip rápido</p>
                <p className="text-xs text-gray-500 mt-1">Usa Agregar para venta normal o + Toppings para personalizar sin perder tiempo en caja.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-green-700">Productos en pedido</span>
                <span className="text-sm font-black text-green-900">{seleccionados.reduce((acc, item) => acc + Number(item.cantidad || 0), 0)}</span>
              </div>
              {/* Lista scrolleable con indicador de mas items */}
              <div className="flex-1 overflow-y-auto mb-2 pr-2 space-y-2 custom-scrollbar min-h-0">
                {seleccionados.map((item, index) => (
                  <div
                    key={`${item.id}-${item.firma_toppings || 'sin-toppings'}-${index}`}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-green-800 font-medium">
                        {construirDescripcionProducto(item)}
                      </span>

                      {item.toppings?.length > 0 && (
                        <div className="pl-2 space-y-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-gray-500">Precio base</span>
                            <span className="text-xs text-gray-600 font-semibold">
                              {formatMoney((Number(item.precio) || 0) * Number(item.cantidad || 0))}
                            </span>
                          </div>

                          {item.toppings.map((topping, tIndex) => (
                            <div key={`${item.id}-t-${topping.id}-${tIndex}`} className="flex items-center justify-between gap-3">
                              <span className="text-xs text-gray-500 italic">
                                + Topping {tIndex + 1}: {topping.nombre}
                              </span>
                              <span className="text-xs text-gray-500 font-semibold">
                                {formatMoney((Number(topping.precio_final) !== undefined ? topping.precio_final : topping.precio) * Number(item.cantidad || 0))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-green-700 font-semibold text-right shrink-0">
                      <div className="font-black text-sm">{formatMoney(item.total)}</div>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <button
                          onClick={() => cambiarCantidad(index, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md border border-amber-200 text-amber-600 hover:bg-amber-50 font-black text-xs"
                          title="Restar 1"
                        >
                          -
                        </button>
                        <span className="min-w-6 text-center text-[11px] font-black text-gray-700">{item.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(index, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md border border-green-200 text-green-700 hover:bg-green-50 font-black text-xs"
                          title="Sumar 1"
                        >
                          +
                        </button>

                        <button
                          onClick={() => handleEditarToppings(item, index)}
                          className="w-6 h-6 flex items-center justify-center rounded-md border border-blue-200 text-blue-500 hover:bg-blue-50 font-black ml-1 text-[10px]"
                          title="Editar toppings"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => setSeleccionados(seleccionados.filter((_, idx) => idx !== index))}
                          className="w-6 h-6 flex items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50 font-black ml-1 text-xs"
                          title="Eliminar línea"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Fin de lista scrolleable */}

              {/* Total general y botón - siempre visible */}
              <div className="mt-auto pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-green-900">Total:</span>
                  <span className="text-lg font-bold text-green-800">
                    ${totalPedido.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg font-bold shadow-md transition-all"
                >
                  Confirmar venta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ display: "none" }}>
        <TicketPrint
          ref={componentRef}
          seleccionados={seleccionados}
          total={totalPedido.toFixed(2)}
          negocio={JSON.parse(localStorage.getItem("negocioSeleccionado"))}
          config={config}
        />
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-3 text-gray-500 text-xl"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold text-green-900 mb-4">
              Registrar venta
            </h2>

            <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Total a cobrar</p>
              <p className="text-2xl font-black text-green-800">${totalPedido.toFixed(2)}</p>
            </div>

            <p className="text-xs text-gray-500 -mt-1 mb-3">
              En <span className="font-semibold">Efectivo</span> se solicita el monto recibido y se calcula el cambio automaticamente.
              En <span className="font-semibold">Tarjeta</span> solo se confirma la venta.
            </p>

            <form onSubmit={onsubmite} className="space-y-4">
              <select
                className="w-full border rounded-lg px-3 py-2"
                {...register('metodo_pago')}
              >
                <option value='Efectivo'>Efectivo</option>
                <option value='Tarjeta'>Tarjeta</option>
                <option value='Transferencia'>Transferencia</option>
              </select>

              {metodoPagoSeleccionado === 'Efectivo' && (
                <>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Dinero recibido"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400 outline-none transition-all"
                    {...register('efectivo_recibido')}
                  />
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-blue-700 font-bold text-xs uppercase tracking-wider">Cambio</span>
                    <span className="font-black text-blue-900 text-lg">${cambio.toFixed(2)}</span>
                  </div>
                </>
              )}

              {metodoPagoSeleccionado === 'Transferencia' && config && (
                <div className="bg-green-50/50 border-2 border-dashed border-green-200 rounded-2xl p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-green-100">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`TRANSFERENCIA A:\n${config.banco_titular || 'Titular'}\nBANCO: ${config.banco_nombre || 'Banco'}\nCLABE: ${config.banco_clabe || '000'}`)}`}
                      alt="QR Pago"
                      className="w-44 h-44 opacity-95"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-green-600 tracking-widest mb-1">Escanea para pagar</p>
                    <p className="text-sm font-black text-green-900 leading-tight">{config.banco_nombre || 'Banco no configurado'}</p>
                    <p className="text-[11px] font-bold text-gray-600 mb-2">{config.banco_titular || 'Titular no configurado'}</p>

                    <div className="bg-white px-3 py-1.5 rounded-lg border border-green-100 flex items-center gap-2 group cursor-pointer active:scale-95 transition-all">
                      <span className="text-[10px] font-mono font-bold text-green-800 tracking-tighter">{config.banco_clabe || '0000 0000 0000 0000 00'}</span>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg font-semibold"
              >
                Confirmar venta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Toppings */}
      {toppingsModalOpen && (
        <div className="fixed inset-0 bg-pink-900/40 backdrop-blur-md flex justify-center items-center z-[60] p-4">
          <div className="bg-white rounded-[32px] p-0 w-full max-w-2xl shadow-2xl border border-pink-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100 shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-pink-700 tracking-tighter uppercase mr-10">Personalizar {tempProducto?.producto}</h2>
                  <p className="text-gray-500 text-xs font-semibold italic mt-1">
                    {tempProducto?.toppings_incluidos || 0} Toppings/Líquidos incluidos a elección.
                  </p>
                </div>
                <button onClick={() => { setToppingsModalOpen(false); setTempToppingsFijos([]); }} className="text-gray-400 hover:text-rose-500 text-2xl font-black">×</button>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Buscar topping..."
                    className="w-full bg-white border-2 border-pink-100 rounded-2xl px-4 py-2 text-sm font-bold outline-none focus:border-pink-300"
                    value={busquedaToppings}
                    onChange={(e) => setBusquedaToppings(e.target.value)}
                  />
                </div>
                <select
                  className="bg-white border-2 border-pink-100 rounded-2xl px-4 py-2 text-sm font-black uppercase text-pink-600 outline-none focus:border-pink-300"
                  value={filtroCategoriaPos}
                  onChange={(e) => setFiltroCategoriaPos(e.target.value)}
                >
                  <option value="Todas">Todas</option>
                  {categorias.map(cat => <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {toppings.length === 0 ? (
                <p className="text-gray-400 text-center py-4 italic">No hay toppings disponibles</p>
              ) : (
                Object.entries(toppingsAgrupados).map(([catNombre, lista]) => {
                  const filtrados = filterToppings(lista, catNombre);
                  if (filtrados.length === 0) return null;
                  return (
                    <div key={catNombre}>
                      <h4 className="text-[10px] font-black text-pink-300 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-pink-400 rounded-full"></span> {catNombre}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {filtrados.map((topping) => (
                          <div
                            key={topping.id}
                            onClick={() => {
                              if (tempToppings.find(t => t.id === topping.id)) {
                                setTempToppings(tempToppings.filter(t => t.id !== topping.id));
                              } else {
                                setTempToppings([...tempToppings, topping]);
                              }
                            }}
                            className={`cursor-pointer group relative p-4 rounded-2xl border-2 transition-all active:scale-95 ${tempToppings.find(t => t.id === topping.id)
                                ? "border-pink-500 bg-pink-50/50 shadow-md"
                                : "border-gray-50 bg-gray-50 hover:border-pink-100"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${tempToppings.find(t => t.id === topping.id) ? "bg-pink-600 text-white" : "bg-white shadow-sm"}`}>
                                {renderToppingIcon(catNombre)}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className={`text-[11px] font-black uppercase tracking-tight truncate ${tempToppings.find(t => t.id === topping.id) ? "text-pink-900" : "text-gray-700"}`}>
                                  {topping.nombre}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-pink-400 uppercase tracking-tighter">
                                    ${topping.precio}
                                  </span>
                                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                                    {catNombre}
                                  </span>
                                </div>
                              </div>
                            </div>
                              {tempToppingsFijos.some(tf => tf.id === topping.id) && (
                                <span className="text-[8px] font-black text-green-500 uppercase tracking-widest mt-0.5">Incluido en receta</span>
                              )}

                              {tempToppings.find(t => t.id === topping.id) && (
                                <div className={`absolute top-2 right-2 w-5 h-5 ${tempToppingsFijos.some(tf => tf.id === topping.id) ? 'bg-green-500' : 'bg-pink-500'} rounded-full flex items-center justify-center text-white text-[10px] shadow-sm`}>
                                  {tempToppingsFijos.some(tf => tf.id === topping.id) ? '★' : '✓'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
              <button
                onClick={() => setToppingsModalOpen(false)}
                className="flex-1 bg-white border-2 border-gray-200 text-gray-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarProducto}
                className="flex-1 bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-pink-100 active:scale-95 transition-all"
              >
                Agregar a Carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductosConDetalle;
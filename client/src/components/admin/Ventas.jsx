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

const ProductosConDetalle = () => {
  
  const [seleccionados, setSeleccionados] = useState([]);
  const [busquedaProductos, setBusquedaProductos] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toppingsModalOpen, setToppingsModalOpen] = useState(false);
  const [tempProducto, setTempProducto] = useState(null);
  const [tempToppings, setTempToppings] = useState([]);
  const [config, setConfig] = useState(null);

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

  const agregarProductoConToppings = (producto, toppingsSeleccionados = []) => {
    const base = Number(producto.precio) || 0;
    const toppingTotal = toppingsSeleccionados.reduce((acc, t) => acc + (Number(t.precio) || 0), 0);
    const precioUnitario = base + toppingTotal;
    const firmaToppings = obtenerFirmaToppings(toppingsSeleccionados);

    setSeleccionados((prev) => {
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

      // Si agregan toppings y ya existe el mismo producto sin toppings,
      // convertimos una unidad de esa linea en la version personalizada.
      let siguiente = [...prev];
      if (toppingsSeleccionados.length > 0) {
        const indexSinToppings = siguiente.findIndex(
          (p) => p.id === producto.id && !(p.firma_toppings || "")
        );

        if (indexSinToppings >= 0) {
          const itemPlano = siguiente[indexSinToppings];
          if (itemPlano.cantidad > 1) {
            const precioPlano = Number(itemPlano.precio_unitario_final) || Number(itemPlano.precio) || 0;
            siguiente[indexSinToppings] = {
              ...itemPlano,
              cantidad: itemPlano.cantidad - 1,
              total: (itemPlano.cantidad - 1) * precioPlano,
            };
          } else {
            siguiente.splice(indexSinToppings, 1);
          }
        }
      }

      return [
        ...siguiente,
        {
          ...producto,
          cantidad: 1,
          toppings: toppingsSeleccionados,
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

  const agregarProductoDirecto = (producto) => {
    if (!validarStockDisponible(producto)) return;
    agregarProductoConToppings(producto, []);
  };

  const agregarProducto = (producto) => {
    if (!validarStockDisponible(producto)) return;
    setTempProducto(producto);
    setTempToppings([]);
    setToppingsModalOpen(true);
  };

  const confirmarProducto = () => {
    agregarProductoConToppings(tempProducto, tempToppings);
    setToppingsModalOpen(false);
    setTempProducto(null);
    setTempToppings([]);
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

  const { toppings } = useToppings();

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
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 min-h-[calc(100dvh-88px)]">
      {/* Tarjetas */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-0">
        <div className="mb-3">
          <input
            type="text"
            placeholder="Buscar producto por nombre, presentación o categoría..."
            className="w-full border border-green-400 rounded-lg px-4 py-2"
            value={busquedaProductos}
            onChange={(e) => setBusquedaProductos(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 flex-1 overflow-y-auto pr-1 sm:pr-2 min-h-[320px] lg:min-h-0">
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

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => agregarProductoDirecto(producto)}
                    disabled={sinStock}
                    className={`text-xs font-bold py-2 rounded-lg ${sinStock ? 'bg-red-300 text-white cursor-not-allowed' : 'bg-green-700 hover:bg-green-800 text-white'}`}
                  >
                    Agregar
                  </button>
                  <button
                    onClick={() => agregarProducto(producto)}
                    disabled={sinStock}
                    className={`text-xs font-bold py-2 rounded-lg border ${sinStock ? 'bg-red-100 text-red-500 border-red-300 cursor-not-allowed' : 'bg-white hover:bg-green-50 text-green-700 border-green-400'}`}
                  >
                    + Toppings
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
      <div className="w-full lg:w-1/2 border rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm flex flex-col bg-white min-h-[340px] lg:max-h-[calc(100dvh-140px)]">
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
            {/* Lista scrolleable */}
            <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-3">
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
                                {formatMoney((Number(topping.precio) || 0) * Number(item.cantidad || 0))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-green-700 font-semibold text-right">
                    <div className="font-black">{formatMoney(item.total)}</div>
                    <div className="mt-2 flex items-center justify-end gap-1">
                    <button
                      onClick={() => cambiarCantidad(index, -1)}
                      className="w-7 h-7 rounded-md border border-amber-200 text-amber-600 hover:bg-amber-50 font-black"
                      title="Restar 1"
                    >
                      -
                    </button>
                    <span className="min-w-7 text-center text-sm font-black text-gray-700">{item.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(index, 1)}
                      className="w-7 h-7 rounded-md border border-green-200 text-green-700 hover:bg-green-50 font-black"
                      title="Sumar 1"
                    >
                      +
                    </button>

                    {/* Botón eliminar */}
                    <button
                      onClick={() => setSeleccionados(seleccionados.filter((_, idx) => idx !== index))}
                      className="w-7 h-7 rounded-md border border-red-200 text-red-500 hover:bg-red-50 font-black ml-1"
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
                </select>

                {metodoPagoSeleccionado === 'Efectivo' && (
                  <>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Dinero recibido"
                      className="w-full border rounded-lg px-3 py-2"
                      {...register('efectivo_recibido')}
                    />
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm">
                      <span className="text-blue-700 font-semibold">Cambio sugerido: </span>
                      <span className="font-black text-blue-900">${cambio.toFixed(2)}</span>
                    </div>
                  </>
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
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60]">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold text-green-900 mb-2">Personalizar {tempProducto?.producto}</h2>
              <p className="text-gray-600 mb-4 text-sm">Selecciona los toppings que desees agregar.</p>
              
              <div className="max-h-[300px] overflow-y-auto mb-6 pr-2">
                {toppings.length === 0 ? (
                  <p className="text-gray-400 text-center py-4 italic">No hay toppings disponibles</p>
                ) : (
                  <>
                  <button
                    onClick={() => {
                      agregarProductoConToppings(tempProducto, []);
                      setToppingsModalOpen(false);
                      setTempProducto(null);
                      setTempToppings([]);
                    }}
                    className="w-full mb-3 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 py-2 rounded-xl font-bold transition-colors"
                  >
                    Continuar sin toppings
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    {toppings.map((topping) => (
                      <div 
                        key={topping.id}
                        onClick={() => {
                          if (tempToppings.find(t => t.id === topping.id)) {
                            setTempToppings(tempToppings.filter(t => t.id !== topping.id));
                          } else {
                            setTempToppings([...tempToppings, topping]);
                          }
                        }}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                          tempToppings.find(t => t.id === topping.id) 
                            ? "border-green-600 bg-green-50 shadow-inner" 
                            : "border-gray-100 bg-gray-50 hover:border-green-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">{topping.nombre}</span>
                          <span className="text-green-700 font-bold text-xs">${topping.precio}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setToppingsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarProducto}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default ProductosConDetalle;
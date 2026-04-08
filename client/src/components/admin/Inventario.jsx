import { useState, useEffect } from "react";
import { useProveedores } from "../../context/ProveedoresContext";
import { useInventario } from "../../context/InventarioContext";
import { useToppings } from "../../context/ToppingsContext";
import { FaTrash, FaPlus, FaSearch, FaBoxOpen, FaEye, FaEyeSlash, FaEdit, FaExclamationTriangle, FaCubes, FaCheckCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "../../api/axios";

const Inventario = () => {
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [vista, setVista] = useState("productos");
  const [insumos, setInsumos] = useState([]);
  const [alertasInsumos, setAlertasInsumos] = useState([]);
  const [insumoModalOpen, setInsumoModalOpen] = useState(false);
  const [insumoEditId, setInsumoEditId] = useState(null);
  const [insumoForm, setInsumoForm] = useState({
    nombre: "",
    unidad: "pza",
    stock_actual: "",
    stock_minimo: "",
    activo: 1
  });
  const [formulario, setFormulario] = useState({
    imagen: null,
    producto: "",
    proveedor: "",
    precio: "",
    stock: "",
    categoria: "General",
    presentacion: "",
    descripcion: "",
    es_oferta: 0,
    precio_anterior: "",
    mostrar_en_menu: 0,
    toppings_incluidos: 0,
    toppings_fijos_ids: [],
    insumo_id: "",
    cantidad_insumo: ""
  });
  const [showReceta, setShowReceta] = useState(false);
  const [filtroBaseNombre, setFiltroBaseNombre] = useState("");
  const [filtroBaseCategoria, setFiltroBaseCategoria] = useState("Todas");

  const { getValorid: getValorProveedores, proveedores } = useProveedores();
  const { toppings, getToppings, categorias } = useToppings();
  const { Crear, inventario, getValorid, eliminarProducto, Actualizar } = useInventario();

  const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const negocioId = !id ? usuario?.negocios_id : id;

  const inventarioFiltrado = inventario.filter((item) =>
    item.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
    (item.proveedor || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (item.categoria && item.categoria.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const insumosFiltrados = insumos.filter((insumo) =>
    (insumo.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (insumo.unidad || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const fetchInsumos = async () => {
    if (!negocioId) return;
    try {
      const [resInsumos, resAlertas] = await Promise.all([
        axios.get(`/insumos/${negocioId}`),
        axios.get(`/insumos-alertas/${negocioId}`)
      ]);
      setInsumos(Array.isArray(resInsumos.data) ? resInsumos.data : []);
      setAlertasInsumos(Array.isArray(resAlertas.data) ? resAlertas.data : []);
    } catch (error) {
      console.error(error);
      setInsumos([]);
      setAlertasInsumos([]);
    }
  };

  const resetInsumoForm = () => {
    setInsumoForm({
      nombre: "",
      unidad: "pza",
      stock_actual: "",
      stock_minimo: "",
      activo: 1
    });
    setInsumoEditId(null);
  };

  const openNuevoInsumo = () => {
    resetInsumoForm();
    setInsumoModalOpen(true);
  };

  const openEditarInsumo = (item) => {
    setInsumoForm({
      nombre: item.nombre || "",
      unidad: item.unidad || "pza",
      stock_actual: item.stock_actual ?? "",
      stock_minimo: item.stock_minimo ?? "",
      activo: Number(item.activo ?? 1)
    });
    setInsumoEditId(item.id);
    setInsumoModalOpen(true);
  };

  const guardarInsumo = async (e) => {
    e.preventDefault();
    if (!insumoForm.nombre.trim()) {
      Swal.fire("Nombre requerido", "Escribe el nombre del insumo.", "warning");
      return;
    }

    const payload = {
      nombre: insumoForm.nombre.trim(),
      unidad: insumoForm.unidad,
      stock_actual: Number(insumoForm.stock_actual || 0),
      stock_minimo: Number(insumoForm.stock_minimo || 0),
      activo: Number(insumoForm.activo || 0),
      negocio_id: negocioId
    };

    try {
      if (insumoEditId) {
        await axios.put(`/insumos/${insumoEditId}`, payload);
      } else {
        await axios.post('/insumos', payload);
      }
      await fetchInsumos();
      setInsumoModalOpen(false);
      resetInsumoForm();
      Swal.fire({ title: "Insumo guardado", icon: "success", confirmButtonColor: "#db2777" });
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo guardar el insumo", "error");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'imagen') {
      setFormulario({ ...formulario, imagen: files[0] });
    } else {
      setFormulario({ ...formulario, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if(formulario.imagen) formData.append("imagen", formulario.imagen);
    formData.append("producto", formulario.producto);
    formData.append("presentacion", formulario.presentacion);
    formData.append("proveedor", formulario.proveedor || "");
    formData.append("precio", formulario.precio);
    formData.append("stock", formulario.stock);
    formData.append("categoria", formulario.categoria);
    formData.append("descripcion", formulario.descripcion || "");
    formData.append("es_oferta", formulario.es_oferta);
    formData.append("precio_anterior", formulario.precio_anterior || "");
    formData.append("mostrar_en_menu", formulario.mostrar_en_menu);
    formData.append("toppings_incluidos", formulario.toppings_incluidos || 0);
    formData.append("liquidos_incluidos", 0); // Unificado
    formData.append("toppings_fijos_ids", JSON.stringify(formulario.toppings_fijos_ids || []));
    formData.append("negocio_id", !id ? usuario.negocios_id : id);
    formData.append("insumo_id", formulario.insumo_id || "");
    formData.append("cantidad_insumo", formulario.cantidad_insumo || "");

    if (editMode) {
        await Actualizar(selectedId, formData);
        Swal.fire({ title: "¡Actualizado!", icon: "success", confirmButtonColor: "#db2777" });
    } else {
        await Crear(formData);
        Swal.fire({ title: "¡Creado!", icon: "success", confirmButtonColor: "#db2777" });
    }

    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormulario({
      imagen: null,
      producto: "",
      proveedor: "",
      precio: "",
      stock: "",
      categoria: "General",
      presentacion: "",
      descripcion: "",
      es_oferta: 0,
      precio_anterior: "",
      mostrar_en_menu: 0,
      toppings_incluidos: 0,
      toppings_fijos_ids: [],
      insumo_id: "",
      cantidad_insumo: ""
    });
    setShowReceta(false);
    setFiltroBaseNombre("");
    setFiltroBaseCategoria("Todas");
    setEditMode(false);
    setSelectedId(null);
  };

  const handleEdit = async (item) => {
    // Buscar toppings fijos
    let fijosIds = [];
    try {
        const res = await axios.get(`/inventario/${item.id}/toppings-fijos`);
        fijosIds = res.data.map(t => t.id);
    } catch (e) {
        console.error("Error al obtener toppings fijos");
    }

    setFormulario({
      ...item,
      toppings_fijos_ids: fijosIds,
      imagen: null,
      insumo_id: "",
      cantidad_insumo: ""
    });

    // Buscar receta de producto
    try {
        const resReceta = await axios.get(`/recetas-producto/${item.id}`);
        if (resReceta.data && resReceta.data.length > 0) {
            setFormulario(prev => ({
                ...prev,
                insumo_id: resReceta.data[0].insumo_id,
                cantidad_insumo: resReceta.data[0].cantidad_por_unidad
            }));
            setShowReceta(true);
        } else {
            setShowReceta(false);
        }
    } catch (e) {
        setShowReceta(false);
    }

    setSelectedId(item.id);
    setEditMode(true);
    setModalOpen(true);
  };

  const handleToggleMenu = (item) => {
    const nuevoEstado = item.mostrar_en_menu === 1 ? 0 : 1;
    Actualizar(item.id, { mostrar_en_menu: nuevoEstado });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Se ocultará del sistema y menú digital.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#db2777',
      cancelButtonColor: '#f3f4f6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        eliminarProducto(id);
      }
    });
  };

  useEffect(() => {
    getValorProveedores();
    getValorid();
    fetchInsumos();
    getToppings();
  }, []);

  return (
    <div className="flex-1 p-3 md:p-6 bg-pink-50/20 flex flex-col h-[calc(100dvh-88px)] overflow-hidden">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4 shrink-0">
        <div>
           <h1 className="text-3xl font-black text-pink-700 tracking-tighter flex items-center gap-3 uppercase">
              <FaBoxOpen /> Inventario Gourmet
           </h1>
           <p className="text-gray-500 font-medium italic">Controla tu stock y lo que ven tus clientes en el menú.</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${vista === 'productos' ? 'bg-pink-600 text-white border-pink-600 shadow-lg shadow-pink-100' : 'bg-white text-pink-600 border-pink-200 hover:bg-pink-50'}`}
            onClick={() => setVista('productos')}
          >
            Productos
          </button>
          <button
            className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${vista === 'insumos' ? 'bg-pink-600 text-white border-pink-600 shadow-lg shadow-pink-100' : 'bg-white text-pink-600 border-pink-200 hover:bg-pink-50'}`}
            onClick={() => setVista('insumos')}
          >
            Insumos
          </button>
          <button
            className="bg-pink-600 hover:bg-pink-700 text-white font-black px-6 py-4 rounded-2xl shadow-lg shadow-pink-100 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest active:scale-95"
            onClick={() => {
              if (vista === 'insumos') {
                openNuevoInsumo();
              } else {
                resetForm();
                setModalOpen(true);
              }
            }}
          >
            <FaPlus /> {vista === 'insumos' ? 'Nuevo Insumo' : 'Nuevo Producto'}
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-[24px] shadow-xl shadow-pink-100/50 mb-4 md:mb-6 flex items-center gap-3 border border-pink-50 shrink-0">
        <FaSearch className="text-pink-200" />
        <input
          type="text"
          placeholder="Buscar producto, categoría o proveedor..."
          className="w-full bg-transparent outline-none font-bold text-gray-700 placeholder:text-pink-100 text-sm"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {vista === "productos" && (
      <>
      {/* Tabla Premium */}
      <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl shadow-pink-100/30 border border-pink-50 overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="min-w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-pink-600 text-white text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-6 py-5">Postre</th>
                <th className="px-6 py-5">Categoría</th>
                <th className="px-6 py-5">Precio</th>
                <th className="px-6 py-5">Stock</th>
                <th className="px-6 py-5 text-center">Menú Digital</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {inventarioFiltrado.map((item) => (
                <tr key={item.id} className="hover:bg-pink-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                           <img 
                            className="w-full h-full object-cover" 
                            src={item.imagen ? `http://localhost:4000${item.imagen}` : '/img/placeholder.png'} 
                            alt={item.producto}
                           />
                        </div>
                        <div>
                           <p className="font-black text-gray-800 text-sm">{item.producto}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.presentacion}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {item.categoria || 'General'}
                     </span>
                  </td>
                  <td className="px-6 py-4 font-black text-pink-700">${item.precio}</td>
                  <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black ${item.stock <= 5 ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-100' : 'bg-green-50 text-green-600'}`}>
                        {item.stock} <span className="ml-1 opacity-50 underline text-[9px] uppercase tracking-tighter">u.</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggleMenu(item)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            item.mostrar_en_menu === 1 
                            ? 'bg-pink-100 text-pink-600 shadow-sm' 
                            : 'bg-gray-50 text-gray-300'
                        }`}
                      >
                         {item.mostrar_en_menu === 1 ? <><FaEye size={12}/> Activo</> : <><FaEyeSlash size={12}/> Oculto</>}
                      </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => handleEdit(item)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-pink-50 text-pink-400 hover:bg-pink-600 hover:text-white transition-all shadow-sm"
                        >
                            <FaEdit size={14} />
                        </button>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-300 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        >
                            <FaTrash size={14} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {vista === "insumos" && (
        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white border border-pink-100 rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-widest text-gray-400 font-black">Total insumos</p>
              <p className="text-2xl font-black text-pink-700 mt-1">{insumos.length}</p>
            </div>
            <div className="bg-white border border-pink-100 rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-widest text-gray-400 font-black">Stock bajo</p>
              <p className="text-2xl font-black text-rose-600 mt-1 flex items-center gap-2"><FaExclamationTriangle />{alertasInsumos.length}</p>
            </div>
            <div className="bg-white border border-pink-100 rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-widest text-gray-400 font-black">Unidades</p>
              <p className="text-lg font-black text-pink-700 mt-1">pza / g / ml / kg / L</p>
            </div>
          </div>

          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl shadow-pink-100/30 border border-pink-50 overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="min-w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-pink-600 text-white text-[10px] uppercase tracking-[0.2em] font-black">
                    <th className="px-6 py-5">Insumo</th>
                    <th className="px-6 py-5">Unidad</th>
                    <th className="px-6 py-5">Stock actual</th>
                    <th className="px-6 py-5">Stock mínimo</th>
                    <th className="px-6 py-5">Estado</th>
                    <th className="px-6 py-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {insumosFiltrados.map((item) => {
                    const bajo = Number(item.stock_actual || 0) <= Number(item.stock_minimo || 0);
                    return (
                      <tr key={item.id} className="hover:bg-pink-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center"><FaCubes size={14} /></span>
                            <span className="font-black text-gray-800 text-sm">{item.nombre}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold uppercase text-gray-600">{item.unidad}</td>
                        <td className="px-6 py-4 font-black text-pink-700">{Number(item.stock_actual).toFixed(2)}</td>
                        <td className="px-6 py-4 font-bold text-gray-600">{Number(item.stock_minimo).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${bajo ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                            {bajo ? 'Bajo' : 'Normal'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openEditarInsumo(item)}
                            className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-pink-50 text-pink-400 hover:bg-pink-600 hover:text-white transition-all shadow-sm"
                          >
                            <FaEdit size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {insumosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-semibold">No hay insumos registrados para esta tienda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Moderno */}
      {modalOpen && (
        <div className="fixed inset-0 bg-pink-900/40 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative border border-pink-100 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 md:px-8 py-5 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100 shrink-0">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-pink-600 hover:shadow-md transition-all"
            >
              ×
            </button>
            
            <div>
                <h2 className="text-2xl font-black text-pink-700 tracking-tighter uppercase mb-1">
                {editMode ? 'Editar Postre' : 'Nuevo Producto'}
                </h2>
                <p className="text-gray-500 text-xs font-semibold italic">Completa los detalles gourmet del producto.</p>
            </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 md:px-8 py-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Imagen del Producto</label>
                    <input type="file" name="imagen" accept="image/*" onChange={handleChange} className="w-full text-[10px] file:bg-pink-50 file:text-pink-600 file:border-0 file:rounded-xl file:px-4 file:py-2 file:font-black file:mr-4 file:cursor-pointer p-2 bg-gray-50 rounded-xl border-2 border-dashed border-pink-100" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest text">Nombre del Producto</label>
                    <input type="text" placeholder="Eje: Vaso de Fresas Especial" name="producto" className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all" value={formulario.producto} onChange={handleChange} required />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Presentación</label>
                    <select name="presentacion" value={formulario.presentacion} onChange={handleChange} className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none cursor-pointer" required>
                        <option value="" disabled>Seleccionar</option>
                        <option value='Unitario'>Unitario</option>
                        <option value='Chico'>Chico</option>
                        <option value='Mediano'>Mediano</option>
                        <option value='Grande'>Grande</option>
                        <option value='1/2 Kilo'>1/2 Kilo</option>
                        <option value='1 Kilo'>1 Kilo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Proveedor (opcional)</label>
                    <select name="proveedor" value={formulario.proveedor} onChange={handleChange} className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none cursor-pointer">
                        <option value="">Sin proveedor</option>
                        {proveedores.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest text">Precio ($)</label>
                    <input type="number" step="0.01" name="precio" className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" value={formulario.precio} onChange={handleChange} required />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Stock Inicial</label>
                    <input type="number" name="stock" className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" value={formulario.stock} onChange={handleChange} required />
                  </div>

                  <div className="col-span-2 space-y-3">
                    <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest leading-tight">
                      Toppings de Receta Base (Siempre Gratis) <br/>
                      <span className="text-[8px] italic lowercase font-bold text-gray-400">Selecciona los que ya vienen incluidos "sí o sí" en este producto.</span>
                    </label>
                    <div className="space-y-3 p-4 bg-pink-50/20 rounded-[2rem] border border-pink-50">
                        <div className="flex flex-col sm:flex-row gap-2 items-center mb-1">
                            {/* Buscador interno */}
                            <div className="relative flex-1 w-full">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300" size={10} />
                                <input 
                                    type="text"
                                    placeholder="Buscar topping..."
                                    className="w-full pl-8 pr-4 py-2 bg-white border border-pink-100 rounded-xl text-[10px] font-bold outline-none focus:border-pink-300"
                                    value={filtroBaseNombre}
                                    onChange={(e) => setFiltroBaseNombre(e.target.value)}
                                />
                            </div>
                            {/* Filtro categorías */}
                            <div className="w-full sm:w-auto">
                                <select 
                                    className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-pink-300 transition-all text-pink-600"
                                    value={filtroBaseCategoria}
                                    onChange={(e) => setFiltroBaseCategoria(e.target.value)}
                                >
                                    <option value="Todas">Todas las categorías</option>
                                    {categorias.map(cat => (
                                        <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto p-1 custom-scrollbar">
                            {toppings
                              .filter(top => {
                                const matchPremium = !(top.categoria_nombre || "").toLowerCase().includes("premium");
                                const matchNombre = top.nombre.toLowerCase().includes(filtroBaseNombre.toLowerCase());
                                const matchCat = filtroBaseCategoria === "Todas" || top.categoria_nombre === filtroBaseCategoria;
                                return matchPremium && matchNombre && matchCat;
                              })
                              .map(top => {
                                const isSelected = formulario.toppings_fijos_ids.includes(top.id);
                                return (
                                    <button
                                        key={top.id}
                                        type="button"
                                        onClick={() => {
                                            const current = [...formulario.toppings_fijos_ids];
                                            if (isSelected) {
                                                setFormulario({...formulario, toppings_fijos_ids: current.filter(id => id !== top.id)});
                                            } else {
                                                setFormulario({...formulario, toppings_fijos_ids: [...current, top.id]});
                                            }
                                        }}
                                        className={`flex items-center gap-2 p-2.5 rounded-xl text-[10px] font-bold border-2 transition-all ${
                                            isSelected 
                                            ? 'bg-pink-600 border-pink-600 text-white shadow-md' 
                                            : 'bg-white border-pink-50 text-gray-500 hover:border-pink-200 shadow-sm'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${isSelected ? 'bg-white text-pink-600' : 'bg-gray-100 text-transparent'}`}>
                                            <FaCheckCircle size={10} />
                                        </div>
                                        <div className="flex flex-col items-start overflow-hidden">
                                          <span className="truncate w-full">{top.nombre}</span>
                                          <span className={`text-[7px] uppercase tracking-tighter ${isSelected ? 'text-pink-100' : 'text-gray-300'}`}>{top.categoria_nombre || 'S/C'}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {toppings.filter(top => {
                            const matchPremium = !(top.categoria_nombre || "").toLowerCase().includes("premium");
                            const matchNombre = top.nombre.toLowerCase().includes(filtroBaseNombre.toLowerCase());
                            const matchCat = filtroBaseCategoria === "Todas" || top.categoria_nombre === filtroBaseCategoria;
                            return matchPremium && matchNombre && matchCat;
                        }).length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-gray-400 font-bold italic text-xs">No se encontraron toppings...</p>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Categoría del Menú</label>
                    <input type="text" placeholder="Eje: Vasos, Especiales, Extras..." name="categoria" className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" value={formulario.categoria} onChange={handleChange} />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Descripción del Producto (¡Enamora al cliente!)</label>
                    <textarea 
                      placeholder="Eje: Un deleite para tus sentidos. Preparado con nuestra receta secreta y los ingredientes más frescos..." 
                      name="descripcion" 
                      rows="3"
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all resize-none" 
                      value={formulario.descripcion} 
                      onChange={handleChange}
                    ></textarea>
                  </div>
              </div>

              <div className="bg-amber-50/50 p-6 rounded-[2rem] border-2 border-amber-100/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                        <FaExclamationTriangle size={16} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-widest">¿Es una Oferta Especial?</h4>
                        <p className="text-[9px] font-bold text-amber-600/70 uppercase">Activa el distintivo de promoción</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={formulario.es_oferta === 1}
                        onChange={(e) => setFormulario({...formulario, es_oferta: e.target.checked ? 1 : 0})}
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {formulario.es_oferta === 1 && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                       <label className="block text-[10px] font-black text-amber-600 uppercase mb-2 px-1 tracking-widest text">Precio Anterior (Sin descuento)</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 font-black">$</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            placeholder="Eje: 120.00"
                            name="precio_anterior" 
                            className="w-full bg-white border-2 border-amber-100 focus:border-amber-400 rounded-2xl px-8 py-3 text-sm font-bold outline-none transition-all text-amber-700" 
                            value={formulario.precio_anterior} 
                            onChange={handleChange} 
                          />
                       </div>
                    </div>
                  )}
              </div>

              <div className="bg-pink-50/50 p-6 rounded-[2rem] border-2 border-pink-100/50 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200">
                          <FaCubes size={16} />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-pink-800 uppercase tracking-widest leading-tight">Vincular con Insumos <br/><span className="text-[8px] text-pink-400 font-bold italic">¿Este producto descuenta vasos, envases, etc?</span></h4>
                        </div>
                     </div>
                     <button 
                        type="button"
                        onClick={() => setShowReceta(!showReceta)}
                        className={`text-[10px] font-bold px-4 py-2 rounded-full transition-all ${showReceta ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-400'}`}
                     >
                        {showReceta ? 'SÍ, VINCULAR' : 'NO'}
                     </button>
                  </div>

                  {showReceta && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Insumo a descontar</label>
                            <select 
                                name="insumo_id"
                                value={formulario.insumo_id}
                                onChange={handleChange}
                                className="w-full bg-white border-2 border-pink-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-pink-200"
                            >
                                <option value="">Seleccionar...</option>
                                {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Cantidad por venta</label>
                            <div className="relative">
                                <input 
                                    type="number"
                                    step="0.001"
                                    name="cantidad_insumo"
                                    value={formulario.cantidad_insumo}
                                    onChange={handleChange}
                                    placeholder="Ej: 1"
                                    className="w-full bg-white border-2 border-pink-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-pink-200"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-pink-400">
                                    {insumos.find(i => i.id == formulario.insumo_id)?.unidad || '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                  )}
              </div>

              <div className="flex items-center gap-3 bg-pink-50/30 p-4 rounded-2xl border border-pink-100">
                  <input 
                    type="checkbox" 
                    id="showMenu"
                    className="w-5 h-5 accent-pink-600 rounded-lg cursor-pointer"
                    checked={formulario.mostrar_en_menu === 1}
                    onChange={(e) => setFormulario({...formulario, mostrar_en_menu: e.target.checked ? 1 : 0})}
                  />
                  <label htmlFor="showMenu" className="text-[11px] font-black text-pink-700 uppercase tracking-widest cursor-pointer select-none">
                     Publicar en Menú Digital (QR)
                  </label>
              </div>

              <button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-pink-100 transition-all active:scale-95">
                {editMode ? 'Guardar Cambios' : 'Registrar Producto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {insumoModalOpen && (
        <div className="fixed inset-0 bg-pink-900/40 backdrop-blur-sm flex justify-center items-center z-[70] p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl relative border border-pink-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
              <button
                onClick={() => setInsumoModalOpen(false)}
                className="absolute top-4 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-pink-600 hover:shadow-md transition-all"
              >
                ×
              </button>
              <h2 className="text-xl font-black text-pink-700 tracking-tighter uppercase">{insumoEditId ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
              <p className="text-gray-500 text-xs font-semibold italic">Control de consumibles: conos, vasos, cucharas, base, toppings.</p>
            </div>

            <form onSubmit={guardarInsumo} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Nombre</label>
                <input
                  name="nombre"
                  value={insumoForm.nombre}
                  onChange={(e) => setInsumoForm({ ...insumoForm, nombre: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  placeholder="Ej: Cono, Vaso 12oz, Base vainilla"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Unidad</label>
                  <select
                    name="unidad"
                    value={insumoForm.unidad}
                    onChange={(e) => setInsumoForm({ ...insumoForm, unidad: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option value="pza">pza</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Stock actual</label>
                  <input
                    type="number"
                    step="0.01"
                    value={insumoForm.stock_actual}
                    onChange={(e) => setInsumoForm({ ...insumoForm, stock_actual: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-pink-300 uppercase mb-1 px-1 tracking-widest">Stock mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={insumoForm.stock_minimo}
                    onChange={(e) => setInsumoForm({ ...insumoForm, stock_minimo: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-pink-50/30 p-3 rounded-2xl border border-pink-100">
                <input
                  type="checkbox"
                  checked={Number(insumoForm.activo) === 1}
                  onChange={(e) => setInsumoForm({ ...insumoForm, activo: e.target.checked ? 1 : 0 })}
                  className="w-5 h-5 accent-pink-600"
                />
                <span className="text-[11px] font-black text-pink-700 uppercase tracking-widest">Insumo activo</span>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-pink-100 transition-all active:scale-95">
                {insumoEditId ? 'Guardar Cambios' : 'Registrar Insumo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
import { useState, useEffect } from "react";
import { useToppings } from "../../context/ToppingsContext";
import { FaPlus, FaTrash, FaIceCream, FaFolderPlus, FaCubes, FaArrowRight, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "../../api/axios";

const Toppings = () => {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openCatModal, setOpenCatModal] = useState(false);
  const [nuevaCat, setNuevaCat] = useState("");
  const negocioSeleccionado = JSON.parse(localStorage.getItem("negocioSeleccionado"));
  const { toppings, categorias, create, remove, update, createCategoria, removeCategoria } = useToppings();
  const [insumos, setInsumos] = useState([]);
  const [insumoId, setInsumoId] = useState("");
  const [cantidadInsumo, setCantidadInsumo] = useState("");
  const [cargandoInsumos, setCargandoInsumos] = useState(false);
  const [showReceta, setShowReceta] = useState(false);
  const [editingTopping, setEditingTopping] = useState(null);

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  const fetchInsumos = async () => {
    if (!negocioSeleccionado?.id) return;
    setCargandoInsumos(true);
    try {
      const res = await axios.get(`/insumos/${negocioSeleccionado.id}`);
      setInsumos(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoInsumos(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!nombre || precio === "") return Swal.fire("Campos vacíos", "Llena el nombre y precio", "warning");

    const toppingData = {
      nombre,
      precio: parseFloat(precio),
      categoria_id: categoriaId || null,
      negocio_id: negocioSeleccionado.id,
      insumo_id: insumoId || null,
      cantidad_por_unidad: parseFloat(cantidadInsumo) || 0
    };

    if (editingTopping) {
        await update(editingTopping.id, toppingData);
        Swal.fire({
            title: "¡Actualizado!",
            text: "El topping ha sido modificado.",
            icon: "success",
            confirmButtonColor: "#db2777"
        });
    } else {
        await create(toppingData);
        Swal.fire({
            title: "¡Agregado!",
            text: "El topping ya está disponible.",
            icon: "success",
            confirmButtonColor: "#db2777"
        });
    }

    setNombre("");
    setPrecio("");
    setCategoriaId("");
    setInsumoId("");
    setCantidadInsumo("");
    setEditingTopping(null);
    setOpenModal(false);
    setShowReceta(false);
  };

  const handleAgregarCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCat) return;
    await createCategoria(nuevaCat, negocioSeleccionado.id);
    setNuevaCat("");
    setOpenCatModal(false);
    Swal.fire("Categoría creada", "", "success");
  }

  const handleEdit = async (topping) => {
    setEditingTopping(topping);
    setNombre(topping.nombre);
    setPrecio(topping.precio);
    setCategoriaId(topping.categoria_id || "");
    
    // Buscar si tiene receta
    try {
        const res = await axios.get(`/recetas-topping/${topping.id}`);
        if (res.data && res.data.length > 0) {
            setInsumoId(res.data[0].insumo_id);
            setCantidadInsumo(res.data[0].cantidad_por_unidad);
            setShowReceta(true);
        } else {
            setInsumoId("");
            setCantidadInsumo("");
            setShowReceta(false);
        }
    } catch (e) {
        setInsumoId("");
        setCantidadInsumo("");
        setShowReceta(false);
    }
    
    setOpenModal(true);
  };

  const handleEliminar = (id) => {
    Swal.fire({
      title: "¿Eliminar topping?",
      text: "No podrás deshacer esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#db2777",
      cancelButtonColor: "#f3f4f6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        remove(id);
      }
    });
  };

  const handleEliminarCat = (id) => {
    Swal.fire({
        title: "¿Eliminar categoría?",
        text: "Los toppings asociados quedarán sin categoría.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#db2777",
        confirmButtonText: "Sí, eliminar"
    }).then((res) => {
        if(res.isConfirmed) removeCategoria(id);
    });
  }

  return (
    <div className="flex-1 bg-pink-50/30 flex flex-col h-[calc(100dvh-88px)] overflow-hidden">
      <main className="p-4 md:p-6 flex flex-col h-full overflow-hidden">
        <header className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-pink-700 flex items-center gap-3 tracking-tighter uppercase">
                <FaIceCream /> Gestión de Toppings
            </h2>
            <p className="text-gray-500 font-medium italic">Organiza tus complementos por categorías.</p>
          </div>
          <div className="flex gap-2">
            <button
                onClick={() => setOpenCatModal(true)}
                className="bg-white border-2 border-pink-100 text-pink-600 font-black px-5 py-3 rounded-2xl shadow-sm hover:bg-pink-50 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
                <FaFolderPlus /> Categorías
            </button>
            <button
                onClick={() => setOpenModal(true)}
                className="bg-pink-600 hover:bg-pink-700 text-white font-black px-5 py-3 rounded-2xl shadow-lg shadow-pink-100 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
                <FaPlus /> Agregar topping
            </button>
          </div>
        </header>

        {categorias.length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                <button 
                    onClick={() => setFiltroCategoria("Todas")}
                    className={`px-5 py-2 rounded-full flex items-center gap-2 shadow-sm transition-all border ${filtroCategoria === "Todas" ? 'bg-pink-600 border-pink-600 text-white shadow-pink-100' : 'bg-white border-pink-100 text-pink-600 hover:bg-pink-50'}`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">Todos</span>
                </button>
                {categorias.map(cat => (
                    <div 
                        key={cat.id} 
                        onClick={() => setFiltroCategoria(cat.nombre)}
                        className={`cursor-pointer px-4 py-2 rounded-full flex items-center gap-2 shadow-sm transition-all border ${filtroCategoria === cat.nombre ? 'bg-pink-600 border-pink-600 text-white shadow-pink-100' : 'bg-white border-pink-100 text-pink-600 hover:bg-pink-50'}`}
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest">{cat.nombre}</span>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEliminarCat(cat.id);
                            }} 
                            className={`transition-colors text-[14px] leading-none ${filtroCategoria === cat.nombre ? 'text-pink-200 hover:text-white' : 'text-gray-300 hover:text-rose-500'}`}
                            title="Eliminar categoría"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-xl shadow-pink-100/30 border border-pink-50 overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="px-4 py-4 md:px-6 md:py-3 bg-pink-600 text-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
            <span className="font-black uppercase tracking-widest text-[10px] md:text-[11px]">Inventario de Toppings</span>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300" size={12} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre..." 
                        className="w-full md:w-64 bg-pink-700/30 border border-pink-400/30 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:bg-pink-700/50 transition-all placeholder:text-pink-200"
                        value={filtroNombre}
                        onChange={(e) => setFiltroNombre(e.target.value)}
                    />
                </div>
                <select 
                    className="w-full sm:w-48 bg-pink-700/30 border border-pink-400/30 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-pink-700/50 transition-all text-white"
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                    <option value="Todas" className="text-gray-800">Todas las categorías</option>
                    {categorias.map(cat => (
                        <option key={cat.id} value={cat.nombre} className="text-gray-800">{cat.nombre}</option>
                    ))}
                    <option value="Sin categoría" className="text-gray-800">SIn categoría</option>
                </select>
            </div>
          </div>

          {toppings.length === 0 ? (
            <div className="p-10 md:p-16 text-center">
              <div className="text-pink-100 text-5xl mb-4 flex justify-center"><FaIceCream /></div>
              <p className="text-gray-400 font-bold italic">Aún no has agregado toppings.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="min-w-full text-left">
                <thead className="bg-pink-50 text-pink-700 uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    <th className="px-4 md:px-6 py-3">Nombre</th>
                    <th className="px-4 md:px-6 py-3">Categoría</th>
                    <th className="px-4 md:px-6 py-3">Precio Extra</th>
                    <th className="px-4 md:px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {toppings
                    .filter(t => {
                        const matchesNombre = t.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
                        const matchesCat = filtroCategoria === "Todas" || (t.categoria_nombre || "Sin categoría") === filtroCategoria;
                        return matchesNombre && matchesCat;
                    })
                    .map((topping) => (
                    <tr key={topping.id} className="hover:bg-pink-50/30 transition-colors">
                      <td className="px-4 md:px-6 py-4 font-black text-gray-800">
                        <div className="flex items-center gap-2">
                          {topping.nombre}
                          {topping.insumo_id && <FaCubes className="text-pink-300" title="Relacionado con inventario" />}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <span className="bg-pink-50 text-pink-500 text-[10px] font-black px-2 py-1 rounded-lg uppercase">
                            {topping.categoria_nombre || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-pink-600 font-bold">${parseFloat(topping.precio).toFixed(2)}</td>
                      <td className="px-4 md:px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(topping)}
                          className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:bg-pink-50 hover:text-pink-600 transition-all inline-flex items-center justify-center shadow-sm"
                          title="Editar topping"
                        >
                          <FaIceCream size={14} />
                        </button>
                        <button
                          onClick={() => handleEliminar(topping.id)}
                          className="w-9 h-9 rounded-xl bg-gray-50 text-gray-300 hover:bg-rose-50 hover:text-rose-500 transition-all inline-flex items-center justify-center shadow-sm"
                          title="Eliminar topping"
                        >
                          <FaTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Topping */}
        {openModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md border border-pink-100 relative">
              <div className="p-6 border-b border-pink-50">
                <h3 className="text-xl font-black text-pink-700 tracking-tight">
                    {editingTopping ? "Editar Topping" : "Nuevo Topping"}
                </h3>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                    {editingTopping ? "Modifica los datos del complemento." : "Completa los datos del nuevo complemento."}
                </p>
              </div>

              <form onSubmit={handleAgregar} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre</label>
                  <input
                    type="text"
                    className="w-full bg-pink-50/30 border-2 border-pink-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-pink-200 transition-all shadow-inner"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Categoría</label>
                        <select
                            className="w-full bg-pink-50/30 border-2 border-pink-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-pink-200"
                            value={categoriaId}
                            onChange={(e) => setCategoriaId(e.target.value)}
                        >
                            <option value="">Ninguna</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Precio Extra ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full bg-pink-50/30 border-2 border-pink-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-pink-200 shadow-inner"
                            value={precio}
                            onChange={(e) => setPrecio(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-pink-50/50 p-4 rounded-2xl border-2 border-pink-100/50 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-pink-700 uppercase tracking-widest flex items-center gap-2">
                           <FaCubes /> ¿Relacionar con Inventario?
                        </label>
                        <button 
                          type="button"
                          onClick={() => setShowReceta(!showReceta)}
                          className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${showReceta ? 'bg-pink-600 text-white shadow-sm shadow-pink-100' : 'bg-gray-200 text-gray-400'}`}
                        >
                          {showReceta ? 'SÍ' : 'NO'}
                        </button>
                    </div>

                    {showReceta && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-3 pt-1">
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Insumo (Materia Prima)</label>
                                <select 
                                    className="w-full bg-white border-2 border-pink-50 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-pink-200"
                                    value={insumoId}
                                    onChange={(e) => setInsumoId(e.target.value)}
                                >
                                    <option value="">Seleccionar insumo...</option>
                                    {insumos.map(i => (
                                        <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Cantidad que consume por venta</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number"
                                        step="0.001"
                                        placeholder="Eje: 1 (pza) o 0.050 (L)"
                                        className="w-full bg-white border-2 border-pink-50 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-pink-200 shadow-inner"
                                        value={cantidadInsumo}
                                        onChange={(e) => setCantidadInsumo(e.target.value)}
                                    />
                                    <span className="text-[10px] font-black text-pink-400">
                                        {insumos.find(i => i.id == insumoId)?.unidad || '-'}
                                    </span>
                                </div>
                                <p className="text-[8px] text-gray-400 italic mt-1 font-bold lowercase">* Se descontará automáticamente al vender este topping.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setOpenModal(false); setEditingTopping(null); setNombre(""); setPrecio(""); setCategoriaId(""); }} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-pink-100 text-[11px] uppercase tracking-widest transition-all">
                    {editingTopping ? "Actualizar" : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Categoría */}
        {openCatModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[71] flex items-center justify-center p-4">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm border border-pink-100">
                <div className="p-6">
                    <h3 className="text-xl font-black text-pink-700 mb-4">Nueva Categoría</h3>
                    <form onSubmit={handleAgregarCategoria} className="space-y-4">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Ej: Líquidos, Secos, Premium..."
                            className="w-full bg-pink-50/30 border-2 border-pink-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-pink-200"
                            value={nuevaCat}
                            onChange={(e) => setNuevaCat(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setOpenCatModal(false)} className="flex-1 py-3 font-bold text-gray-400">Cancelar</button>
                            <button type="submit" className="flex-1 bg-pink-600 text-white font-black py-3 rounded-2xl">Crear</button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Toppings;

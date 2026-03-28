import { useState } from "react";
import { useToppings } from "../../context/ToppingsContext";
import { FaPlus, FaTrash, FaIceCream } from "react-icons/fa";
import Swal from "sweetalert2";

const Toppings = () => {
  const { toppings, create, remove } = useToppings();
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const negocioSeleccionado = JSON.parse(localStorage.getItem("negocioSeleccionado"));

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!nombre || !precio) return Swal.fire("Campos vacíos", "Llena el nombre y precio", "warning");

    await create({
      nombre,
      precio: parseFloat(precio),
      negocio_id: negocioSeleccionado.id
    });

    setNombre("");
    setPrecio("");
    setOpenModal(false);
    Swal.fire({
      title: "¡Agregado!",
      text: "El topping ya está disponible en ventas y menú digital.",
      icon: "success",
      confirmButtonColor: "#db2777"
    });
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

  return (
    <div className="flex-1 bg-pink-50/30">
      <main className="p-4 md:p-8">
        <header className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
          <h2 className="text-3xl font-black text-pink-700 flex items-center gap-3 tracking-tighter uppercase">
            <FaIceCream /> Gestión de Toppings
          </h2>
          <p className="text-gray-500 font-medium italic">Agrega los complementos perfectos para tus fresas.</p>
          </div>
          <button
            onClick={() => setOpenModal(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white font-black px-5 py-3 rounded-2xl shadow-lg shadow-pink-100 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
          >
            <FaPlus /> Agregar topping
          </button>
        </header>

        <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-xl shadow-pink-100/30 border border-pink-50 overflow-hidden">
          <div className="px-4 py-4 md:p-6 bg-pink-600 text-white flex justify-between items-center">
            <span className="font-black uppercase tracking-widest text-[11px] md:text-xs">Total: {toppings.length} opciones</span>
          </div>

          {toppings.length === 0 ? (
            <div className="p-10 md:p-16 text-center">
              <div className="text-pink-100 text-5xl mb-4 flex justify-center"><FaIceCream /></div>
              <p className="text-gray-400 font-bold italic">Aún no has agregado toppings.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="min-w-full text-left">
                <thead className="bg-pink-50 text-pink-700 uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    <th className="px-4 md:px-6 py-3">Nombre</th>
                    <th className="px-4 md:px-6 py-3">Precio Extra</th>
                    <th className="px-4 md:px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {toppings.map((topping) => (
                    <tr key={topping.id} className="hover:bg-pink-50/30 transition-colors">
                      <td className="px-4 md:px-6 py-4 font-black text-gray-800">{topping.nombre}</td>
                      <td className="px-4 md:px-6 py-4 text-pink-600 font-bold">${parseFloat(topping.precio).toFixed(2)}</td>
                      <td className="px-4 md:px-6 py-4 text-right">
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

        {openModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md border border-pink-100 relative">
              <button
                onClick={() => setOpenModal(false)}
                className="absolute top-3 right-4 text-gray-400 hover:text-pink-600 text-2xl"
                aria-label="Cerrar modal"
              >
                ×
              </button>

              <div className="p-6 border-b border-pink-50">
                <h3 className="text-xl font-black text-pink-700 tracking-tight">Nuevo Topping</h3>
                <p className="text-xs text-gray-400 font-semibold mt-1">Agrega un complemento para ventas y menú digital.</p>
              </div>

              <form onSubmit={handleAgregar} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre del Topping</label>
                  <input
                    type="text"
                    placeholder="Ej: Granola, Nutella..."
                    className="w-full bg-pink-50/30 border-2 border-pink-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-pink-200 transition-all shadow-inner"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Precio Extra ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-pink-50/30 border-2 border-pink-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-pink-200 transition-all shadow-inner"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-pink-600 to-pink-500 text-white font-black py-3 rounded-2xl shadow-lg shadow-pink-100 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <FaPlus /> Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Toppings;

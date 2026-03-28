import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGastos } from "../../context/GastosContext";
import { FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';

const Gastos = () => {
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const { getValorid, crearGasto, gastos, eliminarGasto } = useGastos();

  const negocioSeleccionado = JSON.parse(localStorage.getItem("negocioSeleccionado"));

  const gastosFiltrados = gastos.filter(
    (g) =>
      g.motivo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      g.recibio?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const onsubmite = handleSubmit((data) => {
    const datosCompletos = {
      ...data,
      id_negocio: negocioSeleccionado.id
    }
    crearGasto(datosCompletos);
    setModalOpen(false);
    reset();
  });

  useEffect(() => {
    getValorid();
  }, []);


  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-green-900 mb-6">Gastos</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Buscar por motivo o recibió..."
          className="border border-green-500 rounded-lg px-4 py-2 w-full md:w-1/3"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg w-full md:w-auto cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          + Agregar Gasto
        </button>
      </div>

      {/* Tabla */}
      <div className="table-scroll">
        <table className="min-w-full border border-green-200 text-left">
          <thead className="bg-green-100 text-green-900">
            <tr>
              <th className="px-4 py-3 border-b">Motivo</th>
              <th className="px-4 py-3 border-b">Costo</th>
              <th className="px-4 py-3 border-b">Recibió</th>
              <th className="px-4 py-3 border-b">Fecha de pago</th>
              <th className="px-4 py-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastosFiltrados.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="px-4 py-3">{g.motivo}</td>
                <td className="px-4 py-3">${g.costo}</td>
                <td className="px-4 py-3">{g.recibio}</td>
                <td className="px-4 py-3">{new Date(g.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: '¿Eliminar gasto?',
                        text: 'Esta acción no se puede deshacer',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar'
                      }).then(r => {
                        if(r.isConfirmed){
                          eliminarGasto(g.id);
                          Swal.fire('Eliminado', 'El gasto ha sido eliminado', 'success');
                        }
                      });
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded cursor-pointer"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              Registrar Gasto
            </h2>

            <form onSubmit={onsubmite} className="space-y-4">
              <input
                type="text"
                placeholder="Motivo del gasto"
                className="w-full border rounded-lg px-3 py-2"
                {...register('motivo')}
                required
              />
              <input
                type="number"
                placeholder="Costo"
                className="w-full border rounded-lg px-3 py-2"
                {...register('costo')}
                required
              />
              <input
                type="text"
                placeholder="Quién recibió el pago"
                className="w-full border rounded-lg px-3 py-2"
                {...register('recibio')}
                required
              />
              <button
                type="submite"
                className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg font-semibold"
              >
                Registrar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gastos;

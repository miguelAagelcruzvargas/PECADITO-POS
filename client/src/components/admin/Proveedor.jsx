import { useState, useEffect } from "react";
import { useProveedores } from "../../context/ProveedoresContext";
import { useForm } from "react-hook-form";
import { FaTrash } from "react-icons/fa";
import Swal from 'sweetalert2';

const Proveedores = () => {
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { getValorid, crearProveedor, proveedores: proveedoresObtenidos, eliminarProveedor } = useProveedores();

  const { register, handleSubmit, reset } = useForm();

  const negocioSeleccionado = JSON.parse(localStorage.getItem("negocioSeleccionado"));

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const proveedoresFiltrados = proveedoresObtenidos.filter((p) =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );


  const handleDelete = (id) => {
          Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
          }).then((result) => {
            if (result.isConfirmed) {
              console.log(id);
              eliminarProveedor(id);
              Swal.fire(
                'Eliminado!',
                'El registro ha sido eliminado correctamente.',
                'success'
              )
            }
          })
        }

  const onSubmit = handleSubmit((data) => {
    const datosCompletos = {
      ...data,
      id_negocio: negocioSeleccionado ? negocioSeleccionado.id : usuario.negocios_id
    }
    crearProveedor(datosCompletos);
    setModalOpen(false);
    reset();
  });

  useEffect(() => {
    getValorid();
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-green-900 mb-6">Proveedores</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Buscar proveedor..."
          className="border border-green-500 rounded-lg px-4 py-2 w-full md:w-1/3"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg w-full md:w-auto cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          + Agregar Proveedor
        </button>
      </div>

      <div className="table-scroll">
        <table className="min-w-full border border-green-200 text-left">
          <thead className="bg-green-100 text-green-900">
            <tr>
              <th className="px-4 py-3 border-b">ID</th>
              <th className="px-4 py-3 border-b">Nombre del Proveedor</th>
              <th className="px-4 py-3 border-b">Telefono</th>
              <th className="px-4 py-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedoresFiltrados.map((prov, index) => (
              <tr key={prov.id} className="border-t">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{prov.nombre}</td>
                <td className="px-4 py-3">{prov.telefono}</td>
                <td className="px-4 py-3">
                  <button 
                  
                    onClick={() => handleDelete(prov.id)}
                    className="bg-red-500 text-white py-2 px-3 rounded-lg text-md cursor-pointer hover:bg-red-600"
                  
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
                Registrar Proveedor
            </h2>

            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del proveedor"
                className="w-full border rounded-lg px-3 py-2"
                {...register('nombre')}
                required
                autoComplete="off"
              />

              <input
                type="text"
                placeholder="Numero de telefono"
                className="w-full border rounded-lg px-3 py-2"
                {...register('telefono')}
                required
                autoComplete="off"
              />

              <button
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

export default Proveedores;

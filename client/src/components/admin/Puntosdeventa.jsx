import { useState, useEffect } from "react";
import { useNegocios } from "../../context/NegociosContext";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";

const Clientes = () => {
    const [busqueda, setBusqueda] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editModal, setEditModal] = useState(false);

    const { negocios, getNegocios, funcionNull, crearNegocio, actualizarNegocio, getNegocio, negocioSeleccionado, eliminarNegocio } = useNegocios();

    const { register, handleSubmit, setValue, reset } = useForm();

  const negociosFiltrados = negocios.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

    const onSubmit = handleSubmit((data) => {
        if(negocioSeleccionado) {
            actualizarNegocio(negocioSeleccionado.id, data);
            setEditModal(false);
        } else {
            crearNegocio(data);
            setModalOpen(false);
        }
        reset();
    });

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
            eliminarNegocio(id);
            Swal.fire(
              'Eliminado!',
              'El registro ha sido eliminado correctamente.',
              'success'
            )
          }
        })
      }

      useEffect(() => {
        if (negocioSeleccionado) {
          setValue("nombre", negocioSeleccionado.nombre);
          setValue("ubicacion", negocioSeleccionado.ubicacion);
          setValue("tipo", negocioSeleccionado.tipo);
        }
      }, [negocioSeleccionado, setValue]);

    useEffect(() => {
          getNegocios();
      }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-green-900 mb-6">Puntos de venta</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Buscar punto de venta..."
          className="border border-green-500 rounded-lg px-4 py-2 w-full md:w-1/3"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg w-full md:w-auto"
          onClick={() => setModalOpen(true)}
        >
          + Agregar Punto de venta
        </button>
      </div>

      {/* Tabla */}
      <div className="table-scroll">
        <table className="min-w-full border border-green-200 text-left">
          <thead className="bg-green-100 text-green-900">
            <tr>
              <th className="px-4 py-3 border-b">Punto de venta</th>
              <th className="px-4 py-3 border-b">Ubicación</th>
              <th className="px-4 py-3 border-b">Tipo de punto de venta</th>
              <th className="px-4 py-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {negociosFiltrados.map((negocio) => (
              <tr key={negocio.id} className="border-t">
                <td className="px-4 py-3">{negocio.nombre}</td>
                <td className="px-4 py-3">{negocio.ubicacion}</td>
                <td className="px-4 py-3">{negocio.tipo}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      getNegocio(negocio.id); // ← Pasas el negocio que quieres editar
                      setEditModal(true);
                    }}
                    className="text-blue-500 hover:underline ml-4 cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(negocio.id)}
                    className="text-red-500 hover:underline ml-4 cursor-pointer"
                  >
                    Eliminar
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
              onClick={() => {
                funcionNull()
                setModalOpen(false);
                setEditModal(false);
                reset()
              }}
              className="absolute top-2 right-3 text-gray-500 text-xl"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold text-green-900 mb-4">
              {negocioSeleccionado ? "Editar Negocio" : "Agregar Negocio"}
            </h2>

            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del punto de venta"
                className="w-full border rounded-lg px-3 py-2"
                {...register("nombre")}
                required
                />
                <input
                    type="text"
                    placeholder="Ubicación"
                    className="w-full border rounded-lg px-3 py-2"
                    {...register("ubicacion")}
                    required
                />
                <input
                    type="text"
                    placeholder="Tipo de punto de venta"
                    className="w-full border rounded-lg px-3 py-2"
                    {...register("tipo")}
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg font-semibold"
                >
                    {negocioSeleccionado ? "Actualizar" : "Guardar"}
                </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
            <button
              onClick={() => {
                funcionNull();
                setModalOpen(false);
                setEditModal(false)
                reset()
              }}
              className="absolute top-2 right-3 text-gray-500 text-xl"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold text-green-900 mb-4">
              {negocioSeleccionado ? "Editar Negocio" : "Agregar Negocio"}
            </h2>

            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del punto de venta"
                className="w-full border rounded-lg px-3 py-2"
                {...register("nombre")}
                required
                />
                <input
                    type="text"
                    placeholder="Ubicación"
                    className="w-full border rounded-lg px-3 py-2"
                    {...register("ubicacion")}
                    required
                />
                <input
                    type="text"
                    placeholder="Tipo de punto de venta"
                    className="w-full border rounded-lg px-3 py-2"
                    {...register("tipo")}
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg font-semibold"
                >
                    {negocioSeleccionado ? "Actualizar" : "Guardar"}
                </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Clientes;

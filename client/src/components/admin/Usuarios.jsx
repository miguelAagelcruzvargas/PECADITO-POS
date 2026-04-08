import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/UsuariosContext";
import { useNegocios } from "../../context/NegociosContext";
import { PERMISOS_EMPLEADO } from "../../constants/permisos";
import { FaCrown, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";

const Usuarios = () => {
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, watch, reset, setValue } = useForm();

  const { signup, getValorid, users, eliminarUsuario } = useAuth();
  console.log(users);

  const { negocios, getNegocios } = useNegocios();

  const selectedRole = watch('role');
  const watchNombre = watch('nombre');
  const watchNegocio = watch('negocios_id');

  const handleEliminar = async (usuario) => {
    const result = await Swal.fire({
      title: `¿Eliminar a ${usuario.nombre_usuario}?`,
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c026d3',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
      await eliminarUsuario(usuario.id);
      Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Usuario eliminado correctamente.', timer: 1800, showConfirmButton: false });
    }
  };

  const abrirModal = () => {
    reset({
      nombre: "",
      email: "",
      contraseña: "",
      role: "",
      negocios_id: "",
      permisos_list: []
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (watchNombre && watchNegocio) {
      const g_negocio = negocios.find(n => n.id == watchNegocio);
      const suffix = g_negocio?.nombre?.toLowerCase().replace(/\s+/g, '') || `suc${watchNegocio}`;
      const suggested = `${watchNombre.toLowerCase().replace(/\s+/g, '_')}_${suffix}@pos.com`;
      setValue('email', suggested);
    }
  }, [watchNombre, watchNegocio]);

  const usuariosFiltrados = users.filter((usuario) =>
    usuario.nombre_usuario?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const onSubmit = handleSubmit((data) => {
    // Convertir lista de permisos a JSON string para la DB
    const processedData = {
      ...data,
      permisos: data.permisos_list ? JSON.stringify(data.permisos_list) : JSON.stringify([])
    };
    signup(processedData);
    setModalOpen(false);
    reset();
  });

  useEffect(() => {
      getValorid();
      getNegocios();
  }, []);

  return (
    <div className="p-6">
      {/* Título */}
      <h1 className="text-3xl font-bold text-purple-900 mb-6">Usuarios</h1>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Buscar usuario..."
          className="border border-fuchsia-300 rounded-lg px-4 py-2 w-full md:w-1/3"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold px-4 py-2 rounded-lg w-full md:w-auto cursor-pointer"
          onClick={abrirModal}
        >
          + Agregar Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="table-scroll">
        <table className="min-w-full border border-fuchsia-300 text-left">
          <thead className="bg-fuchsia-100 text-fuchsia-900">
            <tr>
              <th className="px-4 py-3 border-b">Nombre</th>
              <th className="px-4 py-3 border-b">Email</th>
              <th className="px-4 py-3 border-b">Rol</th>
              <th className="px-4 py-3 border-b">Estado</th>
              <th className="px-4 py-3 border-b">Punto de venta</th>
              <th className="px-4 py-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id} className="border-t">
                <td className="px-4 py-3 flex items-center gap-2">
                  {usuario.nombre_usuario}
                  {usuario.is_super_admin === 1 && (
                    <span title="Administrador principal (no eliminable)">
                      <FaCrown className="text-amber-400" size={14} />
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{usuario.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full border-2 text-sm font-semibold ${
                      usuario.role === "Administrador"
                        ? "bg-fuchsia-700 text-white border-fuchsia-700"
                        : "text-fuchsia-700 border-fuchsia-700"
                    }`}
                  >
                    {usuario.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${
                      usuario.is_logged_in === 1
                        ? "bg-fuchsia-500"
                        : "bg-rose-500"
                    }`}
                  >
                    {usuario.is_logged_in === 1 
                      ? "Activo"
                      : "Inactivo"
                    }
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                    {usuario.nombre_negocio === null
                      ? 'Todos'
                      : usuario.nombre_negocio
                    }
                </td>
                <td className="px-4 py-3">
                  {usuario.is_super_admin !== 1 ? (
                    <button
                      onClick={() => handleEliminar(usuario)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Eliminar usuario"
                    >
                      <FaTrash size={14} />
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300 italic">Protegido</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg relative flex flex-col max-h-[90vh]">
            <div className="px-6 pt-6 pb-0 flex-shrink-0">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-2 right-3 text-gray-500 text-3xl cursor-pointer"
              >
                ×
              </button>
              <h2 className="text-xl font-semibold text-purple-900 mb-4">Registrar Usuario</h2>
            </div>
            <div className="overflow-y-auto flex-1 px-6 pb-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  className="w-full border rounded-lg px-3 py-2"
                  {...register('nombre')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="usuario@sucursal.pos"
                  className="w-full border rounded-lg px-3 py-2"
                  {...register('email')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña temporal</label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border rounded-lg px-3 py-2"
                  {...register('contraseña')}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  {...register('role')}
                >
                  <option value=''>Selecciona un rol</option>
                  <option value='Empleado'>Empleado</option>
                  <option value='Administrador'>Administrador</option>
                </select>
              </div>

              {selectedRole === 'Empleado' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Punto de venta</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      {...register('negocios_id')}
                    >
                      <option value=''>Selecciona un punto de venta</option>
                      {negocios.map((negocio) => (
                        <option key={negocio.id} value={negocio.id}>{negocio.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100">
                    <p className="text-sm font-bold text-fuchsia-800 mb-3">Permisos de acceso</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {PERMISOS_EMPLEADO.map((perm) => (
                        <label key={perm.id} className="flex items-center gap-2 cursor-pointer hover:text-fuchsia-700 font-medium text-gray-700">
                          <input type="checkbox" value={perm.id} {...register('permisos_list')} className="rounded text-fuchsia-600" />
                          {perm.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-2 rounded-lg font-semibold"
              >
                Registrar usuario
              </button>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;

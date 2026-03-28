import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/UsuariosContext";
import { useNegocios } from "../../context/NegociosContext";
import { PERMISOS_EMPLEADO } from "../../constants/permisos";

const Usuarios = () => {
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, watch, reset, setValue } = useForm();

  const { signup, getValorid, users } = useAuth();
  console.log(users);

  const { negocios, getNegocios } = useNegocios();

  const selectedRole = watch('role');
  const watchNombre = watch('nombre');
  const watchNegocio = watch('negocios_id');

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
      <h1 className="text-3xl font-bold text-green-900 mb-6">Usuarios</h1>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Buscar usuario..."
          className="border border-green-500 rounded-lg px-4 py-2 w-full md:w-1/3"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg w-full md:w-auto cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          + Agregar Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="table-scroll">
        <table className="min-w-full border border-green-500 text-left">
          <thead className="bg-green-100 text-green-900">
            <tr>
              <th className="px-4 py-3 border-b">Nombre</th>
              <th className="px-4 py-3 border-b">Email</th>
              <th className="px-4 py-3 border-b">Rol</th>
              <th className="px-4 py-3 border-b">Estado</th>
              <th className="px-4 py-3 border-b">Punto de venta</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id} className="border-t">
                <td className="px-4 py-3">{usuario.nombre_usuario}</td>
                <td className="px-4 py-3">{usuario.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full border-2 text-sm font-semibold ${
                      usuario.role === "Administrador"
                        ? "bg-green-900 text-white border-green-900"
                        : "text-green-900 border-green-900"
                    }`}
                  >
                    {usuario.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${
                      usuario.is_logged_in === 1
                        ? "bg-green-400"
                        : "bg-red-500"
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
              className="absolute top-2 right-3 text-gray-500 text-3xl cursor-pointer"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold text-green-900 mb-4">Registrar Usuario</h2>

            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre completo"
                className="w-full border rounded-lg px-3 py-2"
                {...register('nombre')}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full border rounded-lg px-3 py-2"
                {...register('email')}

              />
              <input
                type="password"
                placeholder="Contraseña temporal"
                className="w-full border rounded-lg px-3 py-2"
                {...register('contraseña')}
                autoComplete="new-password"
              />
              <select
                className="w-full border rounded-lg px-3 py-2"
                {...register('role')}
              >
                <option selected value=''>Selecciona un role</option>
                <option value='Empleado'>Empleado</option>
                <option value='Administrador'>Administrador</option>
              </select>

               {selectedRole === 'Empleado' && (
                 <>
                  <select
                      className="w-full border rounded-lg px-3 py-2"
                      {...register('negocios_id')}
                    >
                      <option selected value=''>Selecciona un punto de venta</option>
                      {negocios.map((negocio) => (
                        <option value={negocio.id}>{negocio.nombre}</option>
                      ))}
                    </select>

                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <p className="text-sm font-bold text-green-800 mb-3">Permisos de Acceso:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {PERMISOS_EMPLEADO.map((perm) => (
                          <label key={perm.id} className="flex items-center gap-2 cursor-pointer hover:text-green-600">
                            <input type="checkbox" value={perm.id} {...register('permisos_list')} className="rounded text-green-600" />
                            {perm.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg font-semibold cursor-pointer"
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

export default Usuarios;

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  FaUserTie, FaEdit, FaSearch
} from "react-icons/fa";
import { useAuth } from "../../context/UsuariosContext";

export default function Empleados() {
  const { getValorid, users, actualizarUsuario } = useAuth();
  const negocioSeleccionado = JSON.parse(localStorage.getItem("negocioSeleccionado"));
  const [showHorarioModal, setShowHorarioModal] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    tipo_turno: "completo",
    horario_entrada: "08:00",
    horario_salida: "18:00"
  });

  useEffect(() => {
    if (negocioSeleccionado?.id) getValorid();
  }, []);

  const empleados = (users || []).filter(u => (u.role === "Empleado" || u.role === "empleado" || u.role === "Administrador") && !u.is_super_admin);
  const empleadosFiltrados = empleados.filter((u) =>
    (u.nombre_usuario || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleTipoTurno = (tipo) => {
    const horarios = tipo === "medio_turno"
      ? { horario_entrada: "08:00", horario_salida: "14:00" }
      : { horario_entrada: "08:00", horario_salida: "18:00" };
    setForm({ ...form, tipo_turno: tipo, ...horarios });
  };

  const abrirModalHorario = (emp) => {
    setEmpleadoEditando(emp);
    setForm({
      tipo_turno: emp?.tipo_turno || "completo",
      horario_entrada: formatTime(emp?.horario_entrada) === "--" ? "08:00" : formatTime(emp?.horario_entrada),
      horario_salida: formatTime(emp?.horario_salida) === "--" ? "18:00" : formatTime(emp?.horario_salida)
    });
    setShowHorarioModal(true);
  };

  const handleGuardarHorario = async (e) => {
    e.preventDefault();
    if (!empleadoEditando?.id) return;

    setLoading(true);
    try {
      await actualizarUsuario(empleadoEditando.id, {
        tipo_turno: form.tipo_turno,
        horario_entrada: form.horario_entrada,
        horario_salida: form.horario_salida
      });

      await getValorid();
      setShowHorarioModal(false);
      setEmpleadoEditando(null);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Horario actualizado",
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.message || "No se pudo actualizar el horario", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return "--";
    return t.length > 5 ? t.substring(0, 5) : t;
  };

  const tieneHorario = (emp) => Boolean(emp?.horario_entrada && emp?.horario_salida);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-purple-200">
            <FaUserTie size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Horarios de Empleados</h1>
            <p className="text-sm text-gray-400 font-medium">Asigna y edita horarios de empleados ya creados en Personal</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-1/3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-fuchsia-300" />
          <input
            type="text"
            placeholder="Buscar empleado..."
            className="w-full border border-fuchsia-300 rounded-lg pl-10 pr-4 py-2"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de horarios */}
      <div className="table-scroll">
        {empleadosFiltrados.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
            <FaUserTie className="text-gray-300 text-5xl mx-auto mb-4" />
            <p className="text-gray-400 font-bold text-lg">Sin empleados para mostrar</p>
            <p className="text-gray-300 text-sm mt-1">Crea empleados desde Personal y después asígnales horario aquí.</p>
          </div>
        ) : (
          <table className="min-w-full border border-fuchsia-300 text-left">
            <thead className="bg-fuchsia-100 text-fuchsia-900">
              <tr>
                <th className="px-4 py-3 border-b">Nombre</th>
                <th className="px-4 py-3 border-b">Email</th>
                <th className="px-4 py-3 border-b">Turno</th>
                <th className="px-4 py-3 border-b">Horario</th>
                <th className="px-4 py-3 border-b">Acción</th>
              </tr>
            </thead>
            <tbody>
              {empleadosFiltrados.map((emp) => (
                <tr key={emp.id} className="border-t">
                  <td className="px-4 py-3 font-semibold">{emp.nombre_usuario}</td>
                  <td className="px-4 py-3">{emp.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${emp.tipo_turno === 'medio_turno' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'}`}>
                      {emp.tipo_turno === 'medio_turno' ? 'Medio turno' : 'Completo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    {tieneHorario(emp)
                      ? `${formatTime(emp.horario_entrada)} - ${formatTime(emp.horario_salida)}`
                      : 'Sin horario asignado'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => abrirModalHorario(emp)}
                      className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-2"
                    >
                      <FaEdit size={11} /> {tieneHorario(emp) ? 'Editar horario' : 'Crear horario'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Asignar Horario */}
      {showHorarioModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg relative flex flex-col max-h-[90vh]">
            <div className="px-6 pt-6 pb-0 flex-shrink-0">
              <button
                onClick={() => setShowHorarioModal(false)}
                className="absolute top-2 right-3 text-gray-500 text-3xl cursor-pointer"
              >
                ×
              </button>
              <h2 className="text-xl font-semibold text-purple-900 mb-1">{tieneHorario(empleadoEditando) ? 'Editar Horario' : 'Crear Horario'}</h2>
              <p className="text-sm text-gray-500 mb-3 font-semibold">{empleadoEditando?.nombre_usuario}</p>
            </div>
            <div className="overflow-y-auto flex-1 px-6 pb-6">

            <form onSubmit={handleGuardarHorario} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de turno</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "completo", label: "Turno Completo", desc: "8+ horas", icon: "🌅" },
                    { val: "medio_turno", label: "Medio Turno", desc: "~6 horas", icon: "☀️" }
                  ].map(({ val, label, desc, icon }) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => handleTipoTurno(val)}
                      className={`p-3 rounded-lg border text-left transition-all ${form.tipo_turno === val ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-200 bg-white hover:border-fuchsia-300'}`}
                    >
                      <span className="text-xl block mb-1">{icon}</span>
                      <p className={`text-xs font-bold ${form.tipo_turno === val ? 'text-fuchsia-700' : 'text-gray-700'}`}>{label}</p>
                      <p className="text-[10px] text-gray-400">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Horario entrada</label>
                  <input type="time" name="horario_entrada" className="w-full border rounded-lg px-3 py-2" value={form.horario_entrada} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Horario salida</label>
                  <input type="time" name="horario_salida" className="w-full border rounded-lg px-3 py-2" value={form.horario_salida} onChange={handleChange} />
                </div>
              </div>

              <div className="bg-fuchsia-50 p-3 rounded-lg border border-fuchsia-100 text-xs text-fuchsia-700 font-semibold">
                Este horario se aplicará al empleado seleccionado.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-2 rounded-lg font-semibold disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Guardar horario"}
              </button>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

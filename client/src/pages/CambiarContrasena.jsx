import { useState, useEffect } from "react";
import { useAuth } from "../context/UsuariosContext";
import { useNavigate } from "react-router-dom";
import { FaLock, FaEye, FaEyeSlash, FaHeart, FaShieldAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "../api/axios";

export default function CambiarContrasena() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nueva: "", confirmar: "" });
  const [show, setShow] = useState({ nueva: false, confirmar: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.nueva.length < 8) return Swal.fire("Contraseña corta", "Mínimo 8 caracteres.", "warning");
    if (form.nueva !== form.confirmar) return Swal.fire("Error", "No coinciden.", "error");
    if (!/[A-Z]/.test(form.nueva) || !/[0-9]/.test(form.nueva)) {
      return Swal.fire("Seguridad", "Incluye una mayúscula y un número.", "warning");
    }

    setLoading(true);
    try {
      await axios.put(`/usuario/${user.id}`, { contraseña: form.nueva });
      const updatedUser = { ...user, must_change_password: false };
      localStorage.setItem("usuario", JSON.stringify(updatedUser));
      await Swal.fire({ title: "¡Éxito!", text: "Cuenta protegida.", icon: "success", confirmButtonColor: "#db2777" });
      user.role === "Administrador" && !user.negocios_id ? navigate("/administrador") : navigate("/dashboard");
    } catch (e) {
      Swal.fire("Error", "No se pudo actualizar.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
      { level: 0, label: "", color: "" },
      { level: 1, label: "Poco seguro", color: "bg-rose-400" },
      { level: 2, label: "Mejorable", color: "bg-orange-300" },
      { level: 3, label: "Seguro", color: "bg-yellow-400" },
      { level: 4, label: "¡Perfecto!", color: "bg-pink-500" },
    ];
    return map[score];
  };

  const strength = getStrength(form.nueva);

  return (
    <div className="h-screen w-full bg-[#fff5f7] flex items-center justify-center p-4 overflow-y-auto">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none opacity-10 flex items-center justify-center text-pink-300 text-[400px]">
          <FaHeart />
      </div>

      <div className="w-full max-w-[400px] z-10 flex flex-col">
        {/* Card Compacto */}
        <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-pink-50">
          
          {/* Header Súper Compacto */}
          <div className="bg-gradient-to-r from-[#db2777] to-[#be185d] p-5 text-center flex items-center justify-center gap-4">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/20">
                <FaShieldAlt className="text-white text-xl" />
              </div>
              <div className="text-left">
                <h1 className="text-white text-xl font-black leading-none tracking-tight">Primer Acceso</h1>
                <p className="text-pink-100 text-[10px] font-bold uppercase mt-1 opacity-80 tracking-widest">Protege tu cuenta Pecadito</p>
              </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Alerta resumida */}
            <div className="bg-pink-50/50 rounded-2xl p-3 text-[10px] font-bold text-pink-800 flex items-center gap-2">
                <span className="text-base bg-white w-8 h-8 flex items-center justify-center rounded-lg shadow-sm">🔐</span>
                <p>Por seguridad, crea tu contraseña definitiva antes de entrar al sistema.</p>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 px-1">Nueva Contraseña</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" />
                <input
                  type={show.nueva ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-xl pl-10 pr-10 py-3 text-sm font-semibold outline-none focus:border-pink-300 transition-all text-gray-700"
                  value={form.nueva}
                  onChange={(e) => setForm({ ...form, nueva: e.target.value })}
                />
                <button type="button" onClick={() => setShow({ ...show, nueva: !show.nueva })} className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-200">
                  {show.nueva ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>

              {/* Indicador de fortaleza ultra delgado */}
              {form.nueva && (
                <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full flex overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${strength.color}`} style={{width: `${(strength.level / 4) * 100}%`}}></div>
                    </div>
                    <span className="text-[8px] font-black uppercase text-pink-400">{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 px-1">Confirmar</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" />
                <input
                  type={show.confirmar ? "text" : "password"}
                  placeholder="Repite la clave"
                  required
                  className={`w-full bg-gray-50/50 border-2 rounded-xl pl-10 pr-10 py-3 text-sm font-semibold outline-none transition-all ${
                    form.confirmar && form.nueva !== form.confirmar ? "border-rose-300" : "border-gray-100"
                  }`}
                  value={form.confirmar}
                  onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
                />
                <button type="button" onClick={() => setShow({ ...show, confirmar: !show.confirmar })} className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-200">
                  {show.confirmar ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            {/* Checkbox resumido en una fila */}
            <div className="flex gap-2 justify-between px-1">
                <span className={`text-[8px] font-bold ${form.nueva.length >= 8 ? "text-pink-500" : "text-gray-300"}`}>● 8 Caracteres</span>
                <span className={`text-[8px] font-bold ${/[A-Z]/.test(form.nueva) ? "text-pink-500" : "text-gray-300"}`}>● Mayúscula</span>
                <span className={`text-[8px] font-bold ${/[0-9]/.test(form.nueva) ? "text-pink-500" : "text-gray-300"}`}>● Número</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#db2777] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-pink-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <FaHeart className="text-[10px]" />
              {loading ? "GUARDANDO..." : "Activar Acceso"}
            </button>
          </form>
        </div>
        
        {/* Footer pequeño */}
        <p className="mt-4 text-[8px] text-center text-pink-300 font-bold uppercase tracking-widest">
            Seguridad Pecadito 🍓
        </p>
      </div>
    </div>
  );
}

import { FaUserCircle, FaPowerOff, FaArrowLeft, FaBusinessTime } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/UsuariosContext";
import PedidosOnlineAlert from "../admin/PedidosOnlineAlert";
import Swal from "sweetalert2";

export default function Topbar() {
  const { logout, user, actualizarMiPerfil } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleEditarPerfil = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Editar mi perfil",
      html: `
        <input id="swal-nombre" class="swal2-input" placeholder="Nombre" value="${user?.nombre || ""}" />
        <input id="swal-email" class="swal2-input" placeholder="Correo" value="${user?.email || ""}" />
        <input id="swal-pass" type="password" class="swal2-input" placeholder="Nueva contraseña (opcional)" />
      `,
      focusConfirm: false,
      confirmButtonText: "Guardar",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const nombre = document.getElementById("swal-nombre")?.value?.trim();
        const email = document.getElementById("swal-email")?.value?.trim();
        const contraseña = document.getElementById("swal-pass")?.value || "";

        if (!nombre || !email) {
          Swal.showValidationMessage("Nombre y correo son obligatorios");
          return;
        }
        if (contraseña && contraseña.length < 8) {
          Swal.showValidationMessage("La nueva contraseña debe tener al menos 8 caracteres");
          return;
        }
        return { nombre, email, contraseña };
      }
    });

    if (!formValues) return;

    try {
      await actualizarMiPerfil(formValues);
      Swal.fire({ title: "Perfil actualizado", icon: "success", timer: 1800, showConfirmButton: false, toast: true, position: "top-end" });
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.message || "No se pudo actualizar el perfil", "error");
    }
  };

  return (
    <div className="flex justify-between items-center px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-white/80 backdrop-blur-md border-b border-pink-50 sticky top-0 z-40 shadow-sm gap-2">
      <Link to="/dashboard" className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 text-green-800 font-bold text-[10px] md:text-sm bg-green-50/50 hover:bg-green-100/50 transition-all rounded-2xl cursor-pointer border border-green-100">
        <FaArrowLeft />
        <span className="hidden sm:inline">Menu Principal</span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5 pr-2 sm:pr-3 md:pr-5 border-r border-pink-100">
            <PedidosOnlineAlert />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="hidden lg:flex flex-col items-end">
                <span className="text-xs font-black text-gray-700 tracking-tight leading-none">{user?.nombre || "Empleado"}</span>
                <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest mt-1">{user?.role}</span>
            </div>
            <button onClick={handleEditarPerfil} title="Editar perfil" className="leading-none relative group">
              <FaUserCircle className="text-green-800 text-3xl group-hover:text-pink-600 transition-colors cursor-pointer" />
            </button>
            <button 
                onClick={handleLogout}
                className="bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white p-2 md:p-2.5 rounded-xl transition-all border border-rose-100"
                title="Cerrar Sesión"
            >
                <FaPowerOff size={14} />
            </button>
        </div>
      </div>
    </div>
  );
}

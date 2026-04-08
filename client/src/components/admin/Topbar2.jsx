import { FaArrowLeft, FaUserCircle, FaPowerOff } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/UsuariosContext";
import StockAlert from "./StockAlert";
import PedidosOnlineAlert from "./PedidosOnlineAlert";
import TurnoAlert from "./TurnoAlert";
import Swal from "sweetalert2";

export default function Topbar() {
  const { logout, user, actualizarMiPerfil } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isVentas = location.pathname === "/ventas";

  const handleLogout = async () => {
    const ok = await logout();
    if (!ok) return;
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
      <Link to="/administrador" className="flex items-center gap-2 px-3 md:px-4 py-2 text-green-800 font-bold text-[10px] md:text-xs bg-white/50 hover:bg-white transition-all rounded-xl cursor-pointer shadow-sm border border-green-100 uppercase tracking-tighter">
        <FaArrowLeft size={10} />
        <span className="hidden sm:inline">Cambiar Tienda</span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5 pr-2 sm:pr-3 md:pr-5 border-r border-pink-100">
            <PedidosOnlineAlert />
            <TurnoAlert />
            {!isVentas && <StockAlert />}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="hidden lg:flex flex-col items-end">
                <span className="text-xs font-black text-gray-700 tracking-tight leading-none">{user?.nombre || "Admin"}</span>
                <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest mt-1 tracking-widest">{user?.role}</span>
            </div>
            <button onClick={handleEditarPerfil} title="Editar perfil" className="leading-none">
              <FaUserCircle className="text-green-800 text-3xl cursor-pointer hover:text-pink-600 transition-colors" />
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

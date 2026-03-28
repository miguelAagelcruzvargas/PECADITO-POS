import { FaHeart, FaUser, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../context/UsuariosContext";
import { useNavigate } from "react-router-dom";
import PedidosOnlineAlert from "./PedidosOnlineAlert";

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-pink-50 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#db2777] font-black text-2xl tracking-tighter cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="bg-pink-50 p-2 rounded-xl">
            <FaHeart className="text-[#db2777] animate-pulse" />
          </div>
          <span>PECADITO</span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Alerta de Pedidos Digitales */}
          <PedidosOnlineAlert />

          <div className="flex items-center gap-3 bg-pink-50/50 px-4 py-2 rounded-2xl border border-pink-100">
            <div className="text-[#db2777] text-xl">
              <FaUser />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-pink-300 uppercase leading-none">Usuario</span>
              <span className="text-xs font-bold text-gray-700">{user?.nombre || 'Admin'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-[#db2777] hover:bg-[#be185d] text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-pink-100 transition-all active:scale-95"
          >
            <FaSignOutAlt />
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}

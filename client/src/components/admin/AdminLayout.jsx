import Sidebar from "./Sidebar";
import TopbarAdmin from "./Topbar2";
import TopbarEmpleado from "../empleado/Topbar2";
import { useAuth } from "../../context/UsuariosContext";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrador';

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      {/* Sidebar Fijo - Solo para Administradores */}
      {isAdmin && <Sidebar />}

      {/* Área de Contenido */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden xl:pl-0">
        {/* Topbar Fijo - Seleccionado según rol */}
        {isAdmin ? <TopbarAdmin /> : <TopbarEmpleado />}
        
        {/* Contenido Desplazable */}
        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
          <Outlet />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #fdf2f8; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fbcfe8; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f9a8d4; }
        /* Forzar scroll en MacOS y navegadores que ocultan scrollbars */
        .overflow-y-auto { scrollbar-width: thin; scrollbar-color: #fbcfe8 transparent; }
      `}</style>
    </div>
  );
};

export default AdminLayout;

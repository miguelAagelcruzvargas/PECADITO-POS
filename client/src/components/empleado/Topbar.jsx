import { FaArrowLeft, FaLeaf } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/UsuariosContext";

export default function Topbar() {

  const { logout, user } = useAuth();

  return (
    <div className="flex justify-between items-center px-6 py-4 border-b">
      <div className="flex items-center gap-4 text-green-700 font-semibold text-2xl">
        <FaLeaf className="text-green-700" />
        <span>Bienvenid@ {user.nombre}</span>
      </div>
      <Link
        onClick={async (e) => {
          e.preventDefault();
          const ok = await logout();
          if (!ok) return;
          window.location.href = '/';
        }}
        to="/"
        className="flex items-center gap-3 px-6 py-2 text-green-800 font-semibold text-lg hover:bg-gray-300 transition-colors rounded-2xl cursor-pointer"
      >
        <div>Cerrar Sesión</div>
      </Link>
    </div>
  );
}

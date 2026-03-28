import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/UsuariosContext";
import {
  FaTachometerAlt, FaUsers, FaUserFriends, FaTruck, FaShoppingCart,
  FaMoneyBill, FaChartBar, FaCog, FaBoxOpen, FaBars, FaHeart
} from 'react-icons/fa';
import { CgLogOut } from "react-icons/cg";
import { hasPermiso, parsePermisos } from "../../constants/permisos";

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);
  const location = useLocation();

  const toggleSidebar = () => setOpen(!open);

  const { logout, user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    // En tablet/movil cierra el drawer al navegar
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Evita scroll del fondo cuando el drawer está abierto
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const allLinks = [
    { icon: <FaTachometerAlt />, text: 'Dashboard', link: '/dashboard', perm: 'dashboard' },
    { icon: <FaUsers />, text: 'Personal', link: '/usuarios', perm: 'usuarios' },
    { icon: <FaTruck />, text: 'Proveedores', link: '/proveedores', perm: 'proveedores' },
    { icon: <FaShoppingCart />, text: 'Ventas', link: '/ventas', perm: 'ventas' },
    { icon: <FaChartBar />, text: 'Historial Ventas', link: '/historial-ventas', perm: 'ventas' },
    { icon: <FaBoxOpen />, text: 'Inventario', link: '/inventario', perm: 'inventario' },
    { icon: <FaHeart />, text: 'Toppings', link: '/toppings', perm: 'inventario' },
    { icon: <FaShoppingCart />, text: 'Pedidos', link: '/pedidos', perm: 'pedidos' },
    { icon: <FaMoneyBill />, text: 'Gastos', link: '/gastos', perm: 'gastos' },
    { icon: <FaChartBar />, text: 'Reportes', link: '/reportes', perm: 'reportes' },
    { icon: <FaCog />, text: 'Menú Digital', link: '/config-menu', perm: 'configuraciones' },
    { icon: <FaCog />, text: 'Configuraciones', link: '/configuraciones', perm: 'configuraciones' },
  ];

  let filteredLinks = allLinks;
  if (user?.negocios_id) {
    const userPerms = parsePermisos(user?.permisos);
    filteredLinks = allLinks.filter((l) => hasPermiso(userPerms, l.perm));

    if (user?.role === 'Empleado') {
      filteredLinks = filteredLinks.filter((l) => l.perm !== 'usuarios');
    }
  }
  
  const logoutLink = { icon: <CgLogOut />, text: 'Cerrar sesión', link: '/', onclick: () => {logout()} };

  const negocioSeleccionado = JSON.parse(localStorage.getItem("negocioSeleccionado"));

  return (
    <>
      <div className={`xl:hidden fixed top-3 left-3 z-[65] transition-all duration-200 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button
          onClick={toggleSidebar}
          className="w-11 h-11 rounded-xl bg-white/95 border border-pink-100 shadow-md flex items-center justify-center"
          aria-label="Abrir menú"
        >
          <FaBars className="text-2xl text-[#db2777]" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm z-40 xl:hidden transition-all"></div>
      )}

      <div
        ref={sidebarRef}
        className={`bg-white border-r border-pink-50 w-64 p-6 flex flex-col items-stretch
        fixed top-0 left-0 h-[100dvh] z-50 transition-all duration-300 shadow-xl shadow-pink-100/20
        ${open ? 'translate-x-0' : '-translate-x-full'} 
        xl:translate-x-0 xl:sticky xl:top-0 xl:block overflow-hidden`}
      >
        <div className="mb-8 flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-pink-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200 flex-shrink-0">
                <FaHeart size={20} />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-pink-600 text-xl font-black leading-none tracking-tighter truncate">PECADITO</span>
                <span className="text-[10px] text-pink-300 font-black uppercase tracking-widest truncate">{negocioSeleccionado?.nombre || 'Sucursal'}</span>
            </div>
        </div>

        <nav className="space-y-2 md:space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {filteredLinks.map(({ icon, text, link, onclick }) => {
            const isActive = location.pathname === link;
            return (
              <Link 
                onClick={() => {
                   if(onclick) onclick();
                   setOpen(false);
                }} 
                key={text} 
                to={link} 
                className={`flex items-center gap-3 cursor-pointer px-4 py-3 md:py-2.5 rounded-xl transition-all group ${
                    isActive 
                    ? "bg-pink-600 text-white shadow-lg shadow-pink-200" 
                    : "hover:bg-pink-50 hover:text-pink-600"
                }`}
              >
                <span className={`text-base ${isActive ? "text-white" : "text-pink-300 group-hover:text-pink-500"}`}>{icon}</span>
                <span className="text-[13px] tracking-tight">{text}</span>
              </Link>
            )
          })}
        </nav>

        <div className="pt-4 mt-auto border-t border-pink-50 space-y-4 bg-white">
            <Link
              to={logoutLink.link}
              onClick={() => {
                logoutLink.onclick();
                setOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-100"
            >
              <span className="text-base"><CgLogOut /></span>
              <span className="text-[13px] tracking-tight font-semibold">{logoutLink.text}</span>
            </Link>

            <div className="bg-gradient-to-br from-pink-50 to-white p-4 rounded-3xl border border-pink-100/50">
                <p className="text-[9px] text-pink-400 font-black uppercase mb-1 truncate">{negocioSeleccionado?.nombre || 'Tuxtepec'}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-[10px] text-gray-500 font-bold">Sistema Online</p>
                </div>
            </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fce7f3; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f9a8d4; }
      `}</style>
    </>
  );
};

export default Sidebar;

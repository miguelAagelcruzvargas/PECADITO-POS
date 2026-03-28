import { useState, useEffect } from "react";
import { FiEye, FiEyeOff, FiMail, FiLock } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/UsuariosContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { register, handleSubmit } = useForm();
  const { signin, errors, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const slides = [
    { 
      img: "/img/slide1.png", 
      title: "Tus fresas,", 
      highlight: "A tu gusto.",
      text: "Calidad premium en cada bocado."
    },
    { 
      img: "/img/slide2.png", 
      title: "Prueba nuestros", 
      highlight: "Waffles.",
      text: "Crujientes, dulces y deliciosos."
    },
    { 
      img: "/img/slide3.png", 
      title: "Mini Donitas", 
      highlight: "De Pecado.",
      text: "El tamaño ideal para compartir."
    },
    { 
      img: "/img/slide4.png", 
      title: "Refrescante", 
      highlight: "Frappe.",
      text: "Acompaña tu tarde con Pecadito."
    }
  ];

  const onSubmit = handleSubmit((data) => {
    signin(data);
  });

  // Efecto para el carrusel automático
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Cambia cada 5 segundos
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (isAuthenticated) {
      if (user.must_change_password) {
        navigate('/cambiar-contrasena');
        return;
      }
      if (user.role === 'Administrador' && !user.negocios_id) {
        navigate('/administrador');
      } else {
        // Para empleados o administradores asignados a una sucursal
        if (user.negocios_id && !localStorage.getItem("negocioSeleccionado")) {
           localStorage.setItem("negocioSeleccionado", JSON.stringify({
              id: user.negocios_id,
              nombre: "Mi Sucursal"
           }));
        }
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="h-screen w-full bg-[#fdf2f8] flex overflow-hidden relative">
      
      {/* Background Decorations (Bubbles/Blobs) - Solo visibles en móvil para dar vida */}
      <div className="md:hidden absolute top-[-10%] left-[-10%] w-64 h-64 bg-pink-200/40 rounded-full blur-3xl animate-pulse"></div>
      <div className="md:hidden absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-pink-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="md:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-pink-50/50 via-transparent to-pink-100/30 pointer-events-none"></div>

      {/* Sección Izquierda: Carrusel Automático (Visible desde tablets MD) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 h-full relative overflow-hidden bg-pink-100 transition-all duration-1000 shadow-2xl z-10">
        
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img 
              src={slide.img} 
              alt="Pecadito Gourmet"
              className={`w-full h-full object-cover transform transition-transform duration-[6000ms] ${
                index === currentSlide ? "scale-110" : "scale-100"
              }`}
            />
            {/* Overlay degradado */}
            <div className="absolute inset-0 bg-gradient-to-t from-pink-900/60 via-transparent to-transparent"></div>
            
            {/* Texto dinámico según el slide */}
            <div className={`absolute bottom-12 left-12 lg:bottom-16 lg:left-16 text-white max-w-sm lg:max-w-lg z-20 transition-all duration-700 delay-300 ${
                index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                 <div className="h-1 w-12 bg-pink-500 rounded-full"></div>
                 <span className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-pink-100">Menú Pecadito</span>
              </div>
              <h2 className="text-4xl lg:text-6xl xl:text-7xl font-black leading-tight drop-shadow-2xl">
                {slide.title} <br/>
                <span className="text-pink-300 italic font-serif opacity-90">{slide.highlight}</span>
              </h2>
              <p className="mt-4 text-sm lg:text-xl font-medium text-pink-50 opacity-90 italic">
                "{slide.text}"
              </p>
            </div>
          </div>
        ))}

        {/* Indicadores de Slide */}
        <div className="absolute bottom-6 right-8 lg:bottom-8 lg:right-12 z-30 flex gap-2">
            {slides.map((_, i) => (
                <div 
                    key={i} 
                    className={`h-1.5 transition-all duration-500 rounded-full ${
                        i === currentSlide ? "w-8 lg:w-10 bg-pink-400" : "w-2 bg-white/40"
                    }`}
                />
            ))}
        </div>

        {/* Floating Hearts Decor */}
        <div className="absolute top-8 right-8 text-pink-200/20 text-6xl lg:text-8xl rotate-12 z-20 pointer-events-none">
            <FaHeart />
        </div>
      </div>

      {/* Sección Derecha: Formulario (Fondo blanco limpio para seriedad en desktop/tablet) */}
      <div className="w-full md:w-1/2 lg:w-2/5 h-full flex items-center justify-center p-4 md:p-10 lg:p-14 md:bg-white relative z-20 overflow-y-auto">
        
        <div className="w-full max-w-md bg-white/70 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none p-8 md:p-0 rounded-[2.5rem] md:rounded-none shadow-2xl shadow-pink-200/50 md:shadow-none border border-white/50 md:border-none flex flex-col justify-center items-center gap-6 lg:gap-8 transition-all duration-500 my-auto">
          
          {/* Header */}
          <div className="text-center w-full">
            {/* Logo o Corazón (Visible solo en desktop/tablet) */}
            <div className="hidden md:inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-pink-50 rounded-2xl mb-4 text-[#db2777] shadow-inner">
               <FaHeart size={32} className="animate-pulse" />
            </div>

            {/* Logo preview circular (Solo móvil) */}
            <div className="md:hidden relative mb-6 group">
                <div className="mx-auto w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl transition-all duration-1000">
                    <img src={slides[currentSlide].img} className="w-full h-full object-cover" />
                </div>
            </div>

            <h1 className="text-4xl lg:text-5xl font-black text-[#db2777] tracking-tighter leading-none mb-1">PECADITO</h1>
            <p className="text-[#be185d] font-black text-[9px] lg:text-[10px] uppercase tracking-[0.4em] italic leading-none mb-6">Es hora del postre</p>
            
            {errors.map((error, i) => (
              <div key={i} className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-[11px] font-bold animate-in fade-in slide-in-from-top-2 mb-2">
                ⚠️ {error}
              </div>
            ))}
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className="space-y-4 lg:space-y-5 w-full">
            <div className="group">
              <label className="block text-[10px] lg:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-left transition-colors group-focus-within:text-pink-500">Correo Electrónico</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200 group-focus-within:text-pink-500 transition-colors" />
                <input
                  type="email"
                  placeholder="hola@pecadito.com"
                  className="w-full bg-gray-50/50 md:bg-gray-50 border-2 border-pink-100 md:border-gray-100 rounded-2xl pl-12 pr-4 py-4 lg:py-4.5 text-sm outline-none focus:border-pink-400 focus:bg-white focus:ring-8 focus:ring-pink-500/5 transition-all font-semibold text-gray-700 shadow-sm md:shadow-none"
                  required
                  {...register("email")}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] lg:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-left transition-colors group-focus-within:text-pink-500">Contraseña</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200 group-focus-within:text-pink-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-gray-50/50 md:bg-gray-50 border-2 border-pink-100 md:border-gray-100 rounded-2xl pl-12 pr-12 py-4 lg:py-4.5 text-sm outline-none focus:border-pink-400 focus:bg-white focus:ring-8 focus:ring-pink-500/5 transition-all font-semibold text-gray-700 shadow-sm md:shadow-none"
                  required
                  {...register("contraseña")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-200 hover:text-pink-600 transition-colors p-2"
                >
                  {showPassword ? <FiEyeOff size={22} /> : <FiEye size={22} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-br from-[#db2777] via-[#be185d] to-[#9d174d] text-white font-black py-5 rounded-2xl shadow-xl shadow-pink-200/50 hover:scale-[1.02] hover:shadow-2xl active:scale-95 transition-all text-[11px] lg:text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 group px-4 mt-6"
            >
              Iniciar Sesión <FaHeart className="text-white group-hover:scale-125 transition-transform" />
            </button>
          </form>

          {/* Footer */}
          <footer className="text-center w-full mt-2 lg:mt-4">
            <div className="flex items-center justify-center gap-4 mb-3">
                <div className="h-[1px] flex-1 bg-pink-100/50"></div>
                <span className="text-[10px] font-black text-pink-300 uppercase tracking-[0.2em]">Acceso Seguro</span>
                <div className="h-[1px] flex-1 bg-pink-100/50"></div>
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">Gestión Pecadito <span className="text-pink-200 px-1">•</span> © 2026</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

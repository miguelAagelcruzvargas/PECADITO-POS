import { useState, useEffect } from "react";
import { FiEye, FiEyeOff, FiMail, FiLock } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/UsuariosContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit } = useForm();
  const { signin, errors, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const slides = [
    {
      img: "/img/slide1.png",
      title: "Tus fresas,",
      highlight: "A tu gusto.",
      text: "Calidad premium en cada bocado.",
      color: "#ff1744"
    },
    {
      img: "/img/slide2.png",
      title: "Prueba nuestros",
      highlight: "Waffles.",
      text: "Crujientes, dulces y deliciosos.",
      color: "#f57c00"
    },
    {
      img: "/img/slide3.png",
      title: "Mini Donitas",
      highlight: "De Pecado.",
      text: "El tamaño ideal para compartir.",
      color: "#e91e63"
    },
    {
      img: "/img/slide4.png",
      title: "Refrescante",
      highlight: "Frappe.",
      text: "Acompaña tu tarde con Pecadito.",
      color: "#9c27b0"
    }
  ];

  const onSubmit = handleSubmit((data) => {
    setIsLoading(true);
    signin(data);
    setTimeout(() => setIsLoading(false), 2000);
  });

  // Efecto para el carrusel automático
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
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
    <div className="h-screen w-full bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex overflow-hidden relative">

      {/* ============= VERSIÓN MÓVIL (Compacta y Premium) ============= */}
      <div className="md:hidden w-full h-full relative overflow-y-auto no-scrollbar">

        {/* Hero Section - Altura reducida para compactar */}
        <div className="relative h-[32vh] min-h-[220px] overflow-hidden">
          {/* Imagen de fondo con parallax */}
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
            >
              <img
                src={slide.img}
                alt="Pecadito"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 transition-all duration-1000"
                style={{
                  background: `linear-gradient(180deg, transparent 0%, ${slide.color}10 30%, ${slide.color}80 100%)`
                }}
              />
            </div>
          ))}

          {/* Elementos flotantes decorativos - Reducidos */}
          <div className="absolute top-4 right-4 animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
              <FaHeart className="text-white text-xl animate-pulse" />
            </div>
          </div>

          {/* Logo y título superpuesto - Compacto */}
          <div className="absolute bottom-4 left-0 right-0 p-5">
            <div className="flex items-center gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="h-0.5 w-6 rounded-full bg-white/80" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/90">
                Gestión Premium
              </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              PECADITO
            </h1>
          </div>

          {/* Indicadores de slide - Compacto */}
          <div className="absolute top-4 left-4 flex gap-1 z-20">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 transition-all duration-500 rounded-full ${i === currentSlide ? "w-4 bg-white" : "w-1 bg-white/40"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Formulario con glassmorphism - Posicionamiento más alto */}
        <div className="relative -mt-10 px-4 pb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">

          <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl shadow-pink-900/10 border border-white/60 relative overflow-hidden">

            {/* Decoración de fondo del card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200/20 to-transparent rounded-full blur-2xl -z-10" />
            
            {/* Header del formulario - Reducido */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl mb-2 shadow-md shadow-pink-500/20">
                <FaHeart className="text-white text-xl" />
              </div>
              <h2 className="text-xl font-black text-gray-800 leading-tight">Iniciar Sesión</h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Acceso Seguro</p>
            </div>

            {/* Errores */}
            {errors.map((error, i) => (
              <div
                key={i}
                className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-[10px] font-bold mb-3 flex items-center gap-2 animate-in fade-in"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            ))}

            <form onSubmit={onSubmit} className="space-y-3.5">
              <div className="group">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 group-focus-within:text-pink-500 transition-colors">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" size={16} />
                  <input
                    type="email"
                    placeholder="hola@pecadito.com"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-pink-300 focus:bg-white transition-all font-semibold text-gray-700 placeholder:text-gray-300"
                    required
                    {...register("email")}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 group-focus-within:text-pink-500 transition-colors">
                  Contraseña
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-12 py-3 text-sm outline-none focus:border-pink-300 focus:bg-white transition-all font-semibold text-gray-700 placeholder:text-gray-300"
                    required
                    {...register("contraseña")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-2"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black py-4 rounded-xl shadow-xl shadow-pink-500/25 active:scale-[0.98] transition-all text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <FaHeart size={10} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-50 text-center">
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">
                Gestión Pecadito • 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============= VERSIÓN DESKTOP (Sin cambios) ============= */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 h-full relative overflow-hidden bg-pink-100 transition-all duration-1000 shadow-2xl z-10">

        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          >
            <img
              src={slide.img}
              alt="Pecadito Gourmet"
              className={`w-full h-full object-cover transform transition-transform duration-[6000ms] ${index === currentSlide ? "scale-110" : "scale-100"
                }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-pink-900/60 via-transparent to-transparent"></div>

            <div className={`absolute bottom-12 left-12 lg:bottom-16 lg:left-16 text-white max-w-sm lg:max-w-lg z-20 transition-all duration-700 delay-300 ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-1 w-12 bg-pink-500 rounded-full"></div>
                <span className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-pink-100">Menú Pecadito</span>
              </div>
              <h2 className="text-4xl lg:text-6xl xl:text-7xl font-black leading-tight drop-shadow-2xl">
                {slide.title} <br />
                <span className="text-pink-300 italic font-serif opacity-90">{slide.highlight}</span>
              </h2>
              <p className="mt-4 text-sm lg:text-xl font-medium text-pink-50 opacity-90 italic">
                "{slide.text}"
              </p>
            </div>
          </div>
        ))}

        <div className="absolute bottom-6 right-8 lg:bottom-8 lg:right-12 z-30 flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 transition-all duration-500 rounded-full ${i === currentSlide ? "w-8 lg:w-10 bg-pink-400" : "w-2 bg-white/40"
                }`}
            />
          ))}
        </div>

        <div className="absolute top-8 right-8 text-pink-200/20 text-6xl lg:text-8xl rotate-12 z-20 pointer-events-none">
          <FaHeart />
        </div>
      </div>

      {/* Sección Derecha: Formulario Desktop */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/5 h-full items-center justify-center p-10 lg:p-14 bg-white relative z-20 overflow-y-auto">

        <div className="w-full max-w-md flex flex-col justify-center items-center gap-6 lg:gap-8 transition-all duration-500 my-auto">

          <div className="text-center w-full">
            <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-pink-50 rounded-2xl mb-4 text-[#db2777] shadow-inner">
              <FaHeart size={32} className="animate-pulse" />
            </div>

            <h1 className="text-4xl lg:text-5xl font-black text-[#db2777] tracking-tighter leading-none mb-1">PECADITO</h1>
            <p className="text-[#be185d] font-black text-[9px] lg:text-[10px] uppercase tracking-[0.4em] italic leading-none mb-6">Es hora del postre</p>

            {errors.map((error, i) => (
              <div key={i} className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-[11px] font-bold animate-in fade-in slide-in-from-top-2 mb-2">
                ⚠️ {error}
              </div>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4 lg:space-y-5 w-full">
            <div className="group">
              <label className="block text-[10px] lg:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-left transition-colors group-focus-within:text-pink-500">Correo Electrónico</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200 group-focus-within:text-pink-500 transition-colors" />
                <input
                  type="email"
                  placeholder="hola@pecadito.com"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-4 lg:py-4.5 text-sm outline-none focus:border-pink-400 focus:bg-white focus:ring-8 focus:ring-pink-500/5 transition-all font-semibold text-gray-700"
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
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-12 py-4 lg:py-4.5 text-sm outline-none focus:border-pink-400 focus:bg-white focus:ring-8 focus:ring-pink-500/5 transition-all font-semibold text-gray-700"
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

      {/* Animaciones CSS personalizadas */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
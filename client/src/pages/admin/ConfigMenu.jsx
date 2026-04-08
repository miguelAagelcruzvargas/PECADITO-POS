import { useState, useEffect } from "react";
import {
  FaMobileAlt,
  FaLink,
  FaQrcode,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaHeart,
  FaDownload,
  FaStore,
  FaClipboardList,
  FaSearch,
  FaStar,
  FaTicketAlt,
  FaPlus,
  FaTrashAlt,
  FaCalendarAlt,
  FaTag,
  FaUniversity,
  FaSave
} from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "../../api/axios";
import { useInventario } from "../../context/InventarioContext";
import { buildAssetUrl } from "../../utils/assets";

const ConfigMenu = () => {
  const { inventario, getValorid, Actualizar, promociones, getPromociones, crearPromocion, eliminarPromocion } = useInventario();
  const negocioSeleccionado = JSON.parse(localStorage.getItem("negocioSeleccionado"));

  const [searchProduct, setSearchProduct] = useState("");
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [activeTab, setActiveTab] = useState("catalogo"); // 'catalogo' | 'transferencia'
  const [bancoForm, setBancoForm] = useState({
    banco_nombre: "", banco_titular: "", banco_cuenta: "", banco_clabe: "", banco_concepto: ""
  });
  const [savingBanco, setSavingBanco] = useState(false);
  const [menuActivo, setMenuActivo] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [savingHorarios, setSavingHorarios] = useState(false);
  const [mensajeEspecial, setMensajeEspecial] = useState("");
  const [horariosForm, setHorariosForm] = useState({
    Lunes: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Martes: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Miercoles: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Jueves: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Viernes: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Sabado: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Domingo: { abierto: false, apertura: "09:00", cierre: "21:00" }
  });
  const [nuevaPromo, setNuevaPromo] = useState({
    inventario_id: "",
    tipo: "porcentaje",
    valor: "",
    titulo_promo: "¡Oferta Especial!",
    fecha_inicio: "",
    fecha_fin: ""
  });

  useEffect(() => {
    if (negocioSeleccionado?.id) {
      getValorid(negocioSeleccionado.id);
      getPromociones(negocioSeleccionado.id);
      // Cargar datos bancarios
      axios.get(`/configuraciones/${negocioSeleccionado.id}`)
        .then(res => {
          setBancoForm({
            banco_nombre: res.data.banco_nombre || "",
            banco_titular: res.data.banco_titular || "",
            banco_cuenta: res.data.banco_cuenta || "",
            banco_clabe: res.data.banco_clabe || "",
            banco_concepto: res.data.banco_concepto || ""
          });
          setMenuActivo(res.data.menu_activo === 1);
          if (res.data.horarios) {
            try {
              setHorariosForm(JSON.parse(res.data.horarios));
            } catch (e) {
              console.warn("Error parseando horarios");
            }
          }
          setMensajeEspecial(res.data.mensaje_especial || "");
        })
        .catch(() => { });
    }
  }, []);

  const handleToggleDestacado = async (producto) => {
    try {
      const nuevoEstado = producto.destacado ? 0 : 1;
      await Actualizar(producto.id, { destacado: nuevoEstado });

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: nuevoEstado ? "Producto destacado" : "Producto quitado del carrusel",
        showConfirmButton: false,
        timer: 1500,
        background: "#fff5f7",
      });
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el producto", "error");
    }
  };

  const handleGuardarBanco = async (e) => {
    e.preventDefault();
    setSavingBanco(true);
    try {
      // Obtener config actual y hacer PUT con los datos del banco
      const configRes = await axios.get(`/configuraciones/${negocioSeleccionado?.id}`);
      await axios.put(`/configuraciones/${negocioSeleccionado?.id}`, {
        ...configRes.data,
        ...bancoForm
      });
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Datos de transferencia guardados", showConfirmButton: false, timer: 2000, background: "#fff5f7" });
    } catch {
      Swal.fire("Error", "No se pudieron guardar los datos bancarios", "error");
    } finally {
      setSavingBanco(false);
    }
  };

  const handleToggleMenuActivo = async () => {
    setToggleLoading(true);
    try {
      const nuevoEstado = !menuActivo;
      const configRes = await axios.get(`/configuraciones/${negocioSeleccionado?.id}`);
      await axios.put(`/configuraciones/${negocioSeleccionado?.id}`, {
        ...configRes.data,
        menu_activo: nuevoEstado ? 1 : 0
      });
      setMenuActivo(nuevoEstado);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: nuevoEstado ? "Tienda Abierta" : "Tienda Cerrada",
        showConfirmButton: false,
        timer: 1500,
        background: nuevoEstado ? "#f0fdf4" : "#fef2f2"
      });
    } catch {
      Swal.fire("Error", "No se pudo cambiar el estado de la tienda", "error");
    } finally {
      setToggleLoading(false);
    }
  };

  const handleGuardarHorarios = async (e) => {
    e.preventDefault();
    setSavingHorarios(true);
    try {
      const configRes = await axios.get(`/configuraciones/${negocioSeleccionado?.id}`);
      await axios.put(`/configuraciones/${negocioSeleccionado?.id}`, {
        ...configRes.data,
        horarios: JSON.stringify(horariosForm),
        mensaje_especial: mensajeEspecial
      });
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Horarios comerciales actualizados", showConfirmButton: false, timer: 2000, background: "#fff5f7" });
    } catch {
      Swal.fire("Error", "No se pudieron guardar los horarios", "error");
    } finally {
      setSavingHorarios(false);
    }
  };

  const menuUrl = `http://localhost:5000/menu/${negocioSeleccionado?.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&format=png&data=${encodeURIComponent(menuUrl)}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "¡Enlace copiado al portapapeles!",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: "#fff5f7",
    });
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-menu-${negocioSeleccionado?.nombre || "sucursal"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "QR descargado",
        showConfirmButton: false,
        timer: 1800,
        background: "#fff5f7",
      });
    } catch (e) {
      Swal.fire("Error", "No se pudo descargar el QR", "error");
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    try {
      await crearPromocion({
        ...nuevaPromo,
        negocio_id: negocioSeleccionado.id
      });
      setShowPromoModal(false);
      setNuevaPromo({
        inventario_id: "",
        tipo: "porcentaje",
        valor: "",
        titulo_promo: "¡Oferta Especial!",
        fecha_inicio: "",
        fecha_fin: ""
      });
      Swal.fire({
        icon: "success",
        title: "Promoción Creada",
        text: "Tu nueva oferta está programada satisfactoriamente.",
        confirmButtonColor: "#db2777"
      });
    } catch (err) {
      Swal.fire("Error", "No se pudo crear la promoción comercial.", "error");
    }
  };

  const handleDeletePromo = (id) => {
    Swal.fire({
      title: "¿Eliminar promoción?",
      text: "La oferta se retirará del menú digital permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#db2777",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then(async (result) => {
      if (result.isConfirmed) {
        await eliminarPromocion(id);
        Swal.fire("Eliminado", "La promoción ha sido borrada.", "success");
      }
    });
  };

  return (
    <div className="flex-1 bg-pink-50/50">
      <main className="p-3 sm:p-4 md:p-6 pb-24">
        <div className="w-full">
          <header className="mb-4 md:mb-6 bg-white rounded-[24px] border border-pink-100 shadow-md shadow-pink-100/30 p-4 md:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-pink-100 rounded-3xl text-pink-600 shadow-inner">
                  <FaMobileAlt size={30} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-pink-700 tracking-tighter uppercase leading-none mb-2">
                    Menú Digital Pecadito
                  </h2>
                  <p className="text-gray-500 font-bold italic tracking-tight mb-3">
                    Gestiona tu visibilidad y seguridad online.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-widest">
                    <span className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full border border-pink-100 inline-flex items-center gap-2">
                      <FaStore /> {negocioSeleccionado?.nombre || "Sucursal"}
                    </span>
                    <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100 inline-flex items-center gap-2">
                      <FaTicketAlt /> {promociones.length} Promociones activas
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 bg-gray-50 p-2 pr-4 rounded-[2rem] border border-gray-100 shadow-inner">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${menuActivo ? 'bg-green-500 text-white animate-pulse' : 'bg-rose-500 text-white'}`}>
                    <FaStore size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">Estado Tienda</p>
                    <button 
                      onClick={handleToggleMenuActivo}
                      disabled={toggleLoading}
                      className={`text-[9px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${menuActivo ? 'text-green-600' : 'text-rose-600'}`}
                    >
                      {menuActivo ? '● Online' : '○ Offline'}
                    </button>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-2">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={menuActivo}
                      onChange={handleToggleMenuActivo}
                      disabled={toggleLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="flex gap-2">
                  <a
                    href="/inventario"
                    className="bg-white text-pink-600 border-2 border-pink-100 px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-pink-50 transition-all shadow-sm"
                  >
                    Inventario
                  </a>
                  <a
                    href={menuUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-pink-600 text-white px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 inline-flex items-center gap-2"
                  >
                    <FaExternalLinkAlt size={10} /> Online
                  </a>
                </div>
              </div>
            </div>
          </header>

          {/* Tabs de navegación */}
          <div className="flex gap-2 mb-4 md:mb-6">
            <button
              onClick={() => setActiveTab("catalogo")}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === "catalogo" ? 'bg-pink-600 text-white shadow-lg shadow-pink-100' : 'bg-white text-pink-400 border border-pink-100 hover:bg-pink-50'}`}
            >
              📱 Catálogo Digital
            </button>
            <button
              onClick={() => setActiveTab("transferencia")}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "transferencia" ? 'bg-pink-600 text-white shadow-lg shadow-pink-100' : 'bg-white text-pink-400 border border-pink-100 hover:bg-pink-50'}`}
            >
              <FaUniversity size={10} /> Pago
            </button>
            <button
              onClick={() => setActiveTab("horarios")}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "horarios" ? 'bg-pink-600 text-white shadow-lg shadow-pink-100' : 'bg-white text-pink-400 border border-pink-100 hover:bg-pink-50'}`}
            >
              <FaCalendarAlt size={10} /> Horarios del Negocio
            </button>
          </div>

          {/* Sección: Datos de Transferencia */}
          {activeTab === "transferencia" && (
            <section className="bg-white rounded-[28px] p-6 md:p-8 border border-pink-100 shadow-xl shadow-pink-100/20 max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
                  <FaUniversity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Datos de Transferencia</h3>
                  <p className="text-sm text-gray-400 font-medium">Se mostrarán al cliente cuando elija pagar por transferencia</p>
                </div>
              </div>
              <form onSubmit={handleGuardarBanco} className="space-y-4">
                {[
                  { key: "banco_nombre", label: "Nombre del Banco", placeholder: "Ej: BBVA, Banorte, HSBC…" },
                  { key: "banco_titular", label: "Nombre del Titular", placeholder: "Ej: Juan Pérez López" },
                  { key: "banco_cuenta", label: "Número de Cuenta", placeholder: "Ej: 1234567890" },
                  { key: "banco_clabe", label: "CLABE Interbancaria", placeholder: "18 dígitos" },
                  { key: "banco_concepto", label: "Concepto de Pago", placeholder: "Ej: Pedido Pecadito, tu nombre…" }
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1.5">{label}</label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      className="w-full bg-pink-50/50 border-2 border-transparent focus:border-pink-200 rounded-2xl px-4 py-3 font-bold text-sm outline-none transition-all"
                      value={bancoForm[key]}
                      onChange={(e) => setBancoForm({ ...bancoForm, [key]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="bg-blue-50 rounded-2xl p-3 text-xs text-blue-700 font-bold border border-blue-100 flex items-start gap-2">
                  <span>ℹ️</span>
                  <span>Esta información aparecerá en el catálogo digital cuando el cliente seleccione "Pagar por Transferencia".</span>
                </div>
                <button
                  type="submit"
                  disabled={savingBanco}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-pink-200 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <FaSave /> {savingBanco ? "Guardando..." : "Guardar Datos de Transferencia"}
                </button>
              </form>
            </section>
          )}

          {/* Sección: Horarios del Negocio */}
          {activeTab === "horarios" && (
            <section className="bg-white rounded-[28px] p-6 md:p-8 border border-pink-100 shadow-xl shadow-pink-100/20 max-w-3xl animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-amber-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-amber-200">
                  <FaCalendarAlt size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Horarios de Atención</h3>
                  <p className="text-sm text-gray-400 font-bold italic tracking-tight">Define cuándo está abierta tu tienda digital</p>
                </div>
              </div>

              <div className="mb-8 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 shadow-inner">
                <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FaStore size={12} /> Aviso Especial / Nota de hoy (Opcional)
                </label>
                <textarea 
                  placeholder="Ej: ¡Hoy cerramos temprano por inventario! o ¡Aprovecha nuestro 2x1 hoy!"
                  className="w-full bg-white border-2 border-transparent focus:border-amber-200 rounded-2xl p-4 text-xs font-bold text-amber-900 outline-none transition-all shadow-sm"
                  rows={2}
                  value={mensajeEspecial}
                  onChange={(e) => setMensajeEspecial(e.target.value)}
                />
                <p className="mt-2 text-[9px] text-amber-400 font-bold italic">Este mensaje aparecerá resaltado en tu menú digital para todos los clientes.</p>
              </div>

              <div className="space-y-3 mb-8">
                {Object.keys(horariosForm).map((dia) => (
                  <div key={dia} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border-2 transition-all ${horariosForm[dia].abierto ? 'border-pink-50 bg-white shadow-sm' : 'border-gray-50 bg-gray-50 opacity-60'}`}>
                    <div className="flex items-center gap-4 min-w-[120px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={horariosForm[dia].abierto}
                          onChange={(e) => setHorariosForm({...horariosForm, [dia]: {...horariosForm[dia], abierto: e.target.checked}})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                      </label>
                      <span className={`font-black uppercase tracking-widest text-xs ${horariosForm[dia].abierto ? 'text-pink-600' : 'text-gray-400'}`}>
                        {dia}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Abre</span>
                        <input 
                          type="time" 
                          disabled={!horariosForm[dia].abierto}
                          className="bg-pink-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-pink-700 outline-none disabled:opacity-30"
                          value={horariosForm[dia].apertura}
                          onChange={(e) => setHorariosForm({...horariosForm, [dia]: {...horariosForm[dia], apertura: e.target.value}})}
                        />
                      </div>
                      <div className="w-4 h-[2px] bg-pink-100"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Cierra</span>
                        <input 
                          type="time" 
                          disabled={!horariosForm[dia].abierto}
                          className="bg-pink-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-pink-700 outline-none disabled:opacity-30"
                          value={horariosForm[dia].cierre}
                          onChange={(e) => setHorariosForm({...horariosForm, [dia]: {...horariosForm[dia], cierre: e.target.value}})}
                        />
                      </div>
                    </div>

                    <div>
                      {horariosForm[dia].abierto ? (
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">Abierto</span>
                      ) : (
                        <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full border border-gray-200 uppercase tracking-widest">Cerrado</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGuardarHorarios}
                disabled={savingHorarios}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-pink-200 hover:scale-[1.01] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3"
              >
                <FaSave size={18} /> {savingHorarios ? "Guardando Horarios..." : "Guardar Horarios del Negocio"}
              </button>
            </section>
          )}

          {/* Catálogo (contenido original) */}
          {activeTab === "catalogo" && (
            <>
              <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
                <section className="bg-white rounded-[24px] p-4 md:p-5 border border-pink-100 shadow-md shadow-pink-100/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
                      <FaLink />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 tracking-tight">Enlace del Menú</h3>
                      <p className="text-xs text-gray-400 font-semibold italic">WhatsApp, IG o Redes.</p>
                    </div>
                  </div>

                  <div className="bg-pink-50 border border-pink-100 rounded-2xl p-3 md:p-4 mb-4">
                    <p className="text-[11px] font-black text-pink-700 break-all select-all">{menuUrl}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleCopy}
                      className={`w-full py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${copied
                          ? "bg-green-500 text-white shadow-green-100"
                          : "bg-[#db2777] text-white shadow-pink-100 hover:scale-[1.01]"
                        }`}
                    >
                      {copied ? (
                        <><FaCheckCircle size={14} /> Copiado</>
                      ) : (
                        <><FaLink size={14} /> Copiar enlace</>
                      )}
                    </button>
                    <a
                      href={menuUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm bg-white border-2 border-pink-100 text-pink-600 hover:bg-pink-50"
                    >
                      <FaExternalLinkAlt size={12} /> Vista previa
                    </a>
                  </div>
                </section>

                <section className="bg-white rounded-[24px] p-4 md:p-5 border border-pink-100 shadow-md shadow-pink-100/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
                      <FaQrcode />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 tracking-tight">Código QR</h3>
                      <p className="text-xs text-gray-400 font-semibold italic italic">Imprime y colócalo en mesas.</p>
                    </div>
                  </div>

                  <div className="w-full bg-pink-50 rounded-3xl p-4 border border-pink-100 flex items-center justify-center">
                    <img src={qrImageUrl} alt="QR menú digital" className="w-32 h-32 object-contain rounded-xl" />
                  </div>

                  <button
                    onClick={handleDownloadQR}
                    className="mt-4 w-full bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-100"
                  >
                    <FaDownload size={12} /> Descargar QR
                  </button>
                </section>

                {/* Nueva Sección de Promociones Favoritas */}
                <section className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-[24px] p-4 md:p-5 text-white shadow-xl shadow-amber-200/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/20">
                        <FaTicketAlt />
                      </div>
                      <div>
                        <h3 className="font-black tracking-tight">Tus Promos Activas</h3>
                        <p className="text-xs text-amber-50 font-bold opacity-80 italic italic tracking-tighter">Marketing inteligente de fecha a fecha.</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 max-h-[120px] overflow-y-auto no-scrollbar">
                      {promociones.length > 0 ? (
                        promociones.map((promo) => (
                          <div key={promo.id} className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between border border-white/10 group">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                              <span className="text-[10px] font-black uppercase truncate max-w-[120px]">{promo.titulo_promo}</span>
                            </div>
                            <button
                              onClick={() => handleDeletePromo(promo.id)}
                              className="text-white/40 hover:text-white transition-colors p-1"
                            >
                              <FaTrashAlt size={10} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] italic font-bold opacity-70 text-center py-4">No hay promociones programadas.</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPromoModal(true)}
                    className="w-full bg-white text-amber-600 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                  >
                    <FaPlus /> Crear Nueva Promoción
                  </button>
                </section>
              </div>

              <div className="mt-6 md:mt-8 bg-white rounded-[32px] p-6 md:p-8 border border-pink-100 shadow-xl shadow-pink-100/20 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-pink-50/50 rounded-bl-[150px] -z-10 group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-14 h-14 rounded-3xl bg-pink-600 text-white flex items-center justify-center shadow-xl shadow-pink-200 ring-4 ring-pink-50">
                        <FaStar size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tighter uppercase leading-none">Los Imperdibles</h3>
                        <p className="text-gray-400 font-bold italic text-xs md:text-sm mt-1">Elige los 6 productos estrella de tu carrusel.</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative w-full md:w-80">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" />
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      className="w-full bg-pink-50/50 border border-pink-100 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[420px] overflow-y-auto custom-scroll p-2 pr-2 bg-gray-50/10 rounded-[2rem]">
                  {inventario
                    .filter(p => p.activo === 1)
                    .filter(p => !searchProduct || p.producto.toLowerCase().includes(searchProduct.toLowerCase()))
                    .map((producto) => {
                      const isFeatured = producto.destacado === 1;
                      const isAgotado = producto.stock <= 0;
                      return (
                        <div
                          key={producto.id}
                          className={`group/card relative p-3.5 rounded-[2.5rem] border-2 transition-all duration-500 flex items-center gap-4 shadow-sm ${isFeatured
                              ? 'border-pink-500 bg-pink-50/30 shadow-pink-100/50 scale-[1.02]'
                              : 'border-white bg-white hover:border-pink-100'
                            } ${isAgotado ? 'opacity-80' : ''}`}
                        >
                          <div className="relative w-14 h-14 rounded-[1.2rem] overflow-hidden shadow-inner flex-shrink-0 bg-gray-100">
                            <img
                              src={buildAssetUrl(producto.imagen)}
                              alt={producto.producto}
                              className={`w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500 ${isAgotado ? 'grayscale' : ''}`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-black text-gray-800 truncate leading-tight mb-1">{producto.producto}</h4>
                            <div className="flex items-center gap-2">
                              <p className="text-[9px] font-black uppercase tracking-widest text-pink-400 line-clamp-1 truncate max-w-[80px]">{producto.presentacion || 'Tradicional'}</p>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${isAgotado ? 'bg-red-50 text-red-400' : 'bg-green-50 text-green-400'}`}>
                                {producto.stock}u.
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleDestacado(producto)}
                            className={`w-10 h-10 rounded-2xl transition-all duration-300 flex items-center justify-center transform active:scale-90 ${isFeatured
                                ? 'bg-pink-600 text-white shadow-lg shadow-pink-200 rotate-[360deg]'
                                : 'bg-white text-gray-200 border-2 border-gray-100 hover:text-pink-300 hover:border-pink-100'
                              }`}
                          >
                            <FaStar size={16} />
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>

              <footer className="mt-5 pt-4 border-t border-pink-100 text-center">
                <div className="flex justify-center gap-4 text-pink-300 opacity-50 mb-4">
                  <FaHeart /> <FaHeart /> <FaHeart />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">
                  Centro de Campañas Pecadito - Inteligencia Comercial
                </p>
              </footer>
            </>
          )}
        </div>
      </main>

      {/* Modal de Creación de Promoción */}
      {showPromoModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-amber-400/20">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <FaPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Nueva Campaña</h3>
                    <p className="text-xs text-amber-50 font-bold opacity-80 uppercase tracking-widest">Pecadito Marketing Labs</p>
                  </div>
                </div>
                <button onClick={() => setShowPromoModal(false)} className="text-white/60 hover:text-white transition-colors">
                  <FaClipboardList size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePromo} className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scroll">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-amber-600 uppercase mb-2 px-1 tracking-widest">Producto Estrella</label>
                  <select
                    required
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none"
                    value={nuevaPromo.inventario_id}
                    onChange={(e) => setNuevaPromo({ ...nuevaPromo, inventario_id: e.target.value })}
                  >
                    <option value="">Selecciona un producto...</option>
                    {inventario.filter(p => p.activo === 1).map(p => (
                      <option key={p.id} value={p.id}>{p.producto} - {p.presentacion}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-amber-600 uppercase mb-2 px-1 tracking-widest">Nombre de la Promoción</label>
                  <input
                    type="text"
                    placeholder="Ej: ¡Martes de 2x1!, ¡Dúo Especial!"
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                    value={nuevaPromo.titulo_promo}
                    onChange={(e) => setNuevaPromo({ ...nuevaPromo, titulo_promo: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-amber-600 uppercase mb-2 px-1 tracking-widest">Tipo de Promo</label>
                    <select
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                      value={nuevaPromo.tipo}
                      onChange={(e) => setNuevaPromo({ ...nuevaPromo, tipo: e.target.value })}
                    >
                      <option value="porcentaje">% Descuento</option>
                      <option value="precio_fijo">Precio Especial</option>
                      <option value="2x1">Dueto 2x1</option>
                      <option value="personalizado">Texto Libre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-600 uppercase mb-2 px-1 tracking-widest">Valor / Regla</label>
                    <input
                      type="text"
                      placeholder="Ej: 20, 85.00..."
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                      value={nuevaPromo.valor}
                      onChange={(e) => setNuevaPromo({ ...nuevaPromo, valor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-amber-600 uppercase mb-2 px-1 tracking-widest leading-none flex items-center gap-2">
                      <FaCalendarAlt size={10} /> Desde
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none mt-2"
                      value={nuevaPromo.fecha_inicio}
                      onChange={(e) => setNuevaPromo({ ...nuevaPromo, fecha_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-600 uppercase mb-2 px-1 tracking-widest leading-none flex items-center gap-2">
                      <FaCalendarAlt size={10} /> Hasta
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none mt-2"
                      value={nuevaPromo.fecha_fin}
                      onChange={(e) => setNuevaPromo({ ...nuevaPromo, fecha_fin: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-amber-600 to-orange-500 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-200 transition-all hover:scale-[1.02] active:scale-95">
                Activar Campaña 🏷️
              </button>
            </form>
            <div className="p-6 bg-amber-50 text-center">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest italic italic">La promoción se desactivará automáticamente al llegar la fecha fin.</p>
            </div>
          </div>
        </div>
      )}

      {/* Manejo de áreas seguras en iOS para la barra flotante y scroll personalizado */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #fff5f7;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #db2777;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #be185d;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
      `}} />
    </div>
  );
};

export default ConfigMenu;

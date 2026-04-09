import { useState, useEffect } from "react";
import { useAuth } from "../../context/UsuariosContext";
import { useNegocios } from "../../context/NegociosContext";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  FaCheck, FaTrash, FaTelegramPlane, FaStore, FaFileInvoice,
  FaMapMarkerAlt, FaQuoteLeft, FaImage, FaSave, FaTicketAlt,
  FaTextHeight, FaRulerHorizontal, FaEye, FaUniversity, FaCog
} from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "../../api/axios";
import { buildAssetUrl } from "../../utils/assets";

const ConfiguracionPOS = () => {
  const [busqueda, setBusqueda] = useState("");
  const [activeTab, setActiveTab] = useState("marca");
  const [showModal, setShowModal] = useState(false);
  const [nuevaContraseña, setNuevaContraseña] = useState({});
  const [telegramConfig, setTelegramConfig] = useState({ token: '', chatId: '' });
  const [alertCleanupConfig, setAlertCleanupConfig] = useState({
    autoCleanup: true,
    retentionDays: 30
  });
  const [alertLogStats, setAlertLogStats] = useState({
    total: 0,
    sentCountTotal: 0,
    lastSentAt: null
  });
  const [thermalRealist, setThermalRealist] = useState(false);

  // Estados para Identidad de Negocio
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [businessData, setBusinessData] = useState({
    nombre: '',
    ubicacion: '',
    tipo: '',
    rfc: '',
    eslogan: '',
    logo: ''
  });

  // Estados para Configuración de Ticket
  const [ticketConfig, setTicketConfig] = useState({
    ticket_show_phone: 1,
    ticket_show_slogan: 1,
    ticket_font_size: 12,
    ticket_paper_size: '80mm',
    ticket_decoration: 'none'
  });

  const [bancoForm, setBancoForm] = useState({
    banco_nombre: "",
    banco_titular: "",
    banco_cuenta: "",
    banco_clabe: "",
    banco_concepto: ""
  });
  const [savingBanco, setSavingBanco] = useState(false);

  const { getValorid, users, confirm, user, verificacion, eliminarUsuario, actualizarUsuario, actualizarMiPerfil } = useAuth();
  const { actualizarNegocio } = useNegocios();
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm();

  const negocioSeleccionado = JSON.parse(localStorage.getItem("negocioSeleccionado"));

  useEffect(() => {
    getValorid();
    fetchTelegramConfig();
    fetchAlertLogStats();
    if (negocioSeleccionado?.id) {
      fetchBusinessInfo();
      fetchBancoInfo();
    }
  }, []);

  const fetchBancoInfo = async () => {
    try {
      const res = await axios.get(`/configuraciones/${negocioSeleccionado.id}/transferencia`);
      setBancoForm({
        banco_nombre: res.data.banco_nombre || "",
        banco_titular: res.data.banco_titular || "",
        banco_cuenta: res.data.banco_cuenta || "",
        banco_clabe: res.data.banco_clabe || "",
        banco_concepto: res.data.banco_concepto || ""
      });
    } catch (e) {
      console.warn("No se cargaron datos bancarios");
    }
  };

  const fetchBusinessInfo = async () => {
    try {
      const res = await axios.get(`/negocio/${negocioSeleccionado.id}`);
      const data = res.data.data;
      setBusinessData({
        nombre: data.nombre || '',
        ubicacion: data.ubicacion || '',
        tipo: data.tipo || '',
        rfc: data.rfc || '',
        eslogan: data.eslogan || '',
        logo: data.logo || ''
      });
      setLogoPreview(data.logo ? buildAssetUrl(data.logo) : null);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTelegramConfig = async () => {
    if (!negocioSeleccionado?.id) return;
    try {
      const res = await axios.get(`/configuraciones/${negocioSeleccionado.id}`);
      const data = res.data;
      setTelegramConfig({
        token: data.telegram_token || '',
        chatId: data.telegram_chat_id || ''
      });
      setAlertCleanupConfig({
        autoCleanup: data.telegram_alert_auto_cleanup === 1 || data.telegram_alert_auto_cleanup === true,
        retentionDays: Number(data.telegram_alert_retention_days || 30)
      });
      setTicketConfig({
        ticket_show_logo: data.ticket_show_logo === 1 || data.ticket_show_logo === true ? 1 : 0,
        ticket_show_rfc: data.ticket_show_rfc === 1 || data.ticket_show_rfc === true ? 1 : 0,
        ticket_show_address: data.ticket_show_address === 1 || data.ticket_show_address === true ? 1 : 0,
        ticket_show_phone: data.ticket_show_phone === 1 || data.ticket_show_phone === true ? 1 : 0,
        ticket_show_slogan: data.ticket_show_slogan === 1 || data.ticket_show_slogan === true ? 1 : 0,
        ticket_font_size: data.ticket_font_size || 12,
        ticket_paper_size: data.ticket_paper_size || '80mm',
        ticket_decoration: data.ticket_decoration || 'none'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAlertLogStats = async () => {
    if (!negocioSeleccionado?.id) return;
    try {
      const res = await axios.get(`/configuraciones/${negocioSeleccionado.id}/alert-log`);
      setAlertLogStats({
        total: Number(res.data?.total || 0),
        sentCountTotal: Number(res.data?.sent_count_total || 0),
        lastSentAt: res.data?.last_sent_at || null
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveBusiness = async () => {
    try {
      const formData = new FormData();
      formData.append('nombre', businessData.nombre);
      formData.append('ubicacion', businessData.ubicacion);
      formData.append('tipo', businessData.tipo);
      formData.append('rfc', businessData.rfc);
      formData.append('eslogan', businessData.eslogan);
      if (logoFile) {
        formData.append('logo', logoFile);
      } else {
        formData.append('logo', businessData.logo);
      }

      const res = await axios.put(`/negocio/${negocioSeleccionado.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newNegocio = { ...negocioSeleccionado, ...businessData, logo: res.data.logo || businessData.logo };
      localStorage.setItem("negocioSeleccionado", JSON.stringify(newNegocio));

      Swal.fire({
        title: "¡Éxito!",
        text: "Identidad del negocio actualizada correctamente.",
        icon: "success",
        confirmButtonColor: "#db2777"
      });

      fetchBusinessInfo();
    } catch (e) {
      Swal.fire("Error", "No se pudo actualizar la información del negocio", "error");
    }
  };

  const handleSaveEverything = async () => {
    try {
      // Guardar Configuración (Telegram + Ticket)
      await axios.put(`/configuraciones/${negocioSeleccionado.id}`, {
        telegram_token: telegramConfig.token,
        telegram_chat_id: telegramConfig.chatId,
        telegram_alert_auto_cleanup: alertCleanupConfig.autoCleanup ? 1 : 0,
        telegram_alert_retention_days: Math.max(1, Number(alertCleanupConfig.retentionDays || 30)),
        ...ticketConfig,
        ...bancoForm
      });

      Swal.fire({
        title: "Pasos Guardados",
        text: "La configuración se ha actualizado correctamente.",
        icon: "success",
        confirmButtonColor: "#3b82f6"
      });
    } catch (e) {
      Swal.fire("Error", "No se pudo guardar la configuración técnica", "error");
    }
  };

  const handleTestTelegram = async () => {
    if (!negocioSeleccionado?.id) return;

    try {
      const res = await axios.post(`/configuraciones/${negocioSeleccionado.id}/test-telegram`, {
        telegram_token: telegramConfig.token,
        telegram_chat_id: telegramConfig.chatId
      });

      Swal.fire({
        title: 'Telegram funcionando',
        text: res.data?.message || 'Mensaje de prueba enviado correctamente.',
        icon: 'success',
        confirmButtonColor: '#2563eb'
      });
    } catch (e) {
      Swal.fire(
        'Error Telegram',
        e?.response?.data?.message || 'No se pudo enviar la prueba. Revisa token, chat ID y que el bot haya recibido /start.',
        'error'
      );
    }
  };

  const handleSendStockAlert = async () => {
    if (!negocioSeleccionado?.id) return;

    try {
      const res = await axios.post(`/configuraciones/${negocioSeleccionado.id}/send-stock-alert`);

      Swal.fire({
        title: 'Alerta enviada',
        text: res.data?.message || 'La alerta de stock se envió correctamente.',
        icon: 'success',
        confirmButtonColor: '#db2777'
      });
    } catch (e) {
      Swal.fire(
        'Sin envío',
        e?.response?.data?.message || 'No se pudo enviar la alerta de stock.',
        'warning'
      );
    }
  };

  const handleClearAlertLog = async () => {
    if (!negocioSeleccionado?.id) return;

    const confirm = await Swal.fire({
      title: '¿Limpiar historial?',
      text: 'Se eliminará el historial de alertas enviadas para este negocio.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await axios.delete(`/configuraciones/${negocioSeleccionado.id}/alert-log`);
      await fetchAlertLogStats();

      Swal.fire({
        title: 'Historial limpiado',
        text: res.data?.message || 'El historial de alertas fue eliminado.',
        icon: 'success',
        confirmButtonColor: '#db2777'
      });
    } catch (e) {
      Swal.fire('Error', e?.response?.data?.message || 'No se pudo limpiar el historial.', 'error');
    }
  };

  const onSubmit = handleSubmit((data) => {
    const datos = {
      email: user.email,
      contraseña: data.contraseña
    }
    confirm(datos);
    setShowModal(false);
    reset();
  });

  const handleClickDeleteUser = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡Esta acción no se puede deshacer!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        confirmButton: "bg-red-600 text-white px-6 py-2 rounded-lg mx-2 font-bold",
        cancelButton: "bg-gray-300 text-gray-800 px-6 py-2 rounded-lg mx-2 font-bold"
      }
    });

    if (isConfirmed) {
      eliminarUsuario(id);
      Swal.fire("Eliminado", "Usuario removido correctamente", "success");
    }
  };

  const usuariosFiltrados = users.filter((usuario) =>
    usuario.nombre_usuario?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen bg-[#fdf2f8]">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
            Centro de <span className="text-pink-600">Control</span>
          </h1>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1">Configuración de Marca y Sucursal</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/puntos-de-venta')}
            className="bg-white text-pink-600 border border-pink-100 px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:shadow-pink-200 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <FaStore /> Sucursales
          </button>
          <button
            onClick={handleSaveEverything}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <FaSave /> Guardar Todo
          </button>
        </div>
      </div>

      <div className="bg-white border border-pink-50 rounded-2xl p-2 shadow-sm inline-flex flex-wrap gap-2 w-full md:w-auto">
        {[
          { id: "marca", label: "Marca" },
          { id: "ticket", label: "Ticket" },
          { id: "pagos", label: "Pagos" },
          { id: "integraciones", label: "Integraciones" },
          { id: "equipo", label: "Equipo" },
          ...(Number(user?.is_super_admin) === 1 ? [{ id: "seguridad", label: "Seguridad" }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                ? "bg-pink-600 text-white shadow-lg shadow-pink-100"
                : "bg-gray-50 text-gray-500 hover:bg-pink-50 hover:text-pink-600"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "marca" && (
        <div className="grid lg:grid-cols-1 gap-6">
          <div className="bg-white border border-pink-50 rounded-[32px] p-6 shadow-xl shadow-pink-100/10 space-y-6 relative overflow-hidden h-fit">
            <div className="flex items-center gap-3 border-b border-pink-50 pb-4">
              <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <FaStore size={20} />
              </div>
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Identidad Visual</h2>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              {/* Logo Upload */}
              <div className="relative group flex-shrink-0">
                <div className="w-32 h-32 rounded-full border-4 border-pink-50 bg-gray-50 flex items-center justify-center overflow-hidden shadow-xl relative">
                  {logoPreview ? (
                    <img src={logoPreview} className="w-full h-full object-cover" />
                  ) : (
                    <FaImage size={40} className="text-pink-200" />
                  )}
                  <label className="absolute inset-0 bg-pink-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 backdrop-blur-sm">
                    <FaImage size={24} className="mb-2" />
                    <span className="text-[10px] font-black uppercase">Cambiar Logo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </label>
                </div>
              </div>

              <div className="w-full space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Nombre Comercial</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 outline-none focus:border-pink-300 transition-all font-bold text-gray-700"
                      value={businessData.nombre}
                      onChange={(e) => setBusinessData({ ...businessData, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest">RFC / Fiscal ID</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 outline-none focus:border-pink-300 transition-all font-bold text-gray-700 uppercase"
                      value={businessData.rfc}
                      onChange={(e) => setBusinessData({ ...businessData, rfc: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Dirección Sucursal</label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 outline-none focus:border-pink-300 transition-all font-bold text-gray-700"
                    value={businessData.ubicacion}
                    onChange={(e) => setBusinessData({ ...businessData, ubicacion: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Eslogan del Ticket</label>
                  <textarea
                    rows="2"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 outline-none focus:border-pink-300 transition-all font-bold text-gray-700 resize-none"
                    value={businessData.eslogan}
                    onChange={(e) => setBusinessData({ ...businessData, eslogan: e.target.value })}
                  />
                </div>

                <button
                  onClick={handleSaveBusiness}
                  className="w-full bg-pink-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-pink-100 hover:bg-pink-700 transition-all flex items-center justify-center gap-2"
                >
                  <FaSave /> Actualizar Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ticket" && (
        <div className="grid lg:grid-cols-1 gap-6">
          <div className="bg-white border border-pink-50 rounded-[32px] p-6 shadow-xl shadow-pink-100/10 space-y-5 flex flex-col">
            <div className="flex items-center gap-3 border-b border-pink-50 pb-4">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                <FaTicketAlt size={20} />
              </div>
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Estilo de Impresión</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 flex-1">
              {/* Opciones de Ticket */}
              <div className="space-y-4">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">Ajustes Visibles</p>

                <div className="space-y-3">
                  {[
                    { key: 'ticket_show_logo', label: 'Mostrar Logo', icon: <FaImage /> },
                    { key: 'ticket_show_rfc', label: 'Mostrar RFC', icon: <FaFileInvoice /> },
                    { key: 'ticket_show_address', label: 'Mostrar Dirección', icon: <FaMapMarkerAlt /> },
                    { key: 'ticket_show_slogan', label: 'Mostrar Eslogan', icon: <FaQuoteLeft /> },
                  ].map(opt => (
                    <div key={opt.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 text-gray-700">
                        <span className="text-pink-400">{opt.icon}</span>
                        <span className="text-xs font-black uppercase">{opt.label}</span>
                      </div>
                      <button
                        onClick={() => setTicketConfig({ ...ticketConfig, [opt.key]: ticketConfig[opt.key] ? 0 : 1 })}
                        className={`w-12 h-6 rounded-full transition-all relative ${ticketConfig[opt.key] ? 'bg-pink-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${ticketConfig[opt.key] ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mt-6">
                  <label className="text-[11px] font-black text-pink-500 uppercase tracking-widest block">¿Cómo quieres decorar el ticket?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'none', label: 'Línea Simple', icon: '➖', color: 'bg-gray-100', border: 'border-gray-200' },
                      { id: 'desserts', label: 'Postres', icon: '🍰🍓', color: 'bg-orange-50', border: 'border-orange-200' },
                      { id: 'hearts', label: 'Corazoncitos', icon: '❤️❤️', color: 'bg-pink-50', border: 'border-pink-200' },
                      { id: 'stars', label: 'Estrellas', icon: '⭐⭐', color: 'bg-yellow-50', border: 'border-yellow-200' },
                    ].map(style => (
                      <button
                        key={style.id}
                        onClick={() => setTicketConfig({ ...ticketConfig, ticket_decoration: style.id })}
                        className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all shadow-sm hover:scale-105 active:scale-95 ${ticketConfig.ticket_decoration === style.id ? `border-pink-600 ${style.color} ring-4 ring-pink-100` : `border-gray-100 bg-white`}`}
                      >
                        <span className="text-2xl mb-1">{style.icon}</span>
                        <span className="text-[10px] font-black uppercase text-gray-600">{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-2 flex items-center gap-2"><FaRulerHorizontal /> Ancho Papel</label>
                    <select
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-xs font-bold font-mono outline-none focus:border-pink-300"
                      value={ticketConfig.ticket_paper_size}
                      onChange={(e) => setTicketConfig({ ...ticketConfig, ticket_paper_size: e.target.value })}
                    >
                      <option value="58mm">58mm (Pequ.)</option>
                      <option value="80mm">80mm (Estánd.)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-2 flex items-center gap-2"><FaTextHeight /> Tamaño Letra</label>
                    <input
                      type="number"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-xs font-bold font-mono outline-none focus:border-pink-300"
                      value={ticketConfig.ticket_font_size}
                      onChange={(e) => setTicketConfig({ ...ticketConfig, ticket_font_size: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Preview del Ticket */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2"><FaEye /> Vista Previa Real</p>
                  <button
                    onClick={() => setThermalRealist(!thermalRealist)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${thermalRealist ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {thermalRealist ? '📠 Modo Térmico Activo' : '🎨 Modo Diseño (Color)'}
                  </button>
                </div>
                <div className={`flex-1 ${thermalRealist ? 'bg-zinc-300 border-zinc-400' : 'bg-gray-100 border-gray-300'} rounded-3xl p-4 border-2 border-dashed flex items-center justify-center transition-all duration-500`}>
                  <div
                    className={`bg-white shadow-2xl p-4 font-mono text-black overflow-hidden pointer-events-none transition-all ${thermalRealist ? 'grayscale contrast-125 brightness-105' : ''}`}
                    style={{
                      width: ticketConfig.ticket_paper_size === '58mm' ? '140px' : '180px',
                      fontSize: `${ticketConfig.ticket_font_size - 4}px`
                    }}
                  >
                    <div className="text-center border-b border-dashed border-gray-300 pb-2 mb-2">
                      {ticketConfig.ticket_show_logo && (
                        (logoPreview || businessData.logo) ? (
                          <img
                            src={logoPreview || buildAssetUrl(businessData.logo)}
                            alt="Logo negocio"
                            className="w-8 h-8 rounded-full object-cover mx-auto mb-1"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-1"></div>
                        )
                      )}
                      <p className="font-bold uppercase text-[10px] leading-tight">{businessData.nombre || 'PECADITO'}</p>
                      {ticketConfig.ticket_show_address && <p className="text-[7px] leading-tight">{businessData.ubicacion.substring(0, 20)}...</p>}
                      {ticketConfig.ticket_show_rfc && <p className="text-[7px] font-bold">{businessData.rfc || 'RFC-000-XX'}</p>}
                      {ticketConfig.ticket_decoration !== 'none' && (
                        <div className={`text-[10px] mt-2 border-t border-b border-gray-100 py-1 ${thermalRealist ? '' : 'bg-gray-50/50'}`}>
                          {ticketConfig.ticket_decoration === 'hearts' ? (thermalRealist ? '♥ ♥ ♥' : '❤️ ❤️ ❤️') :
                            ticketConfig.ticket_decoration === 'desserts' ? (thermalRealist ? '※ ※ ※' : '🍰 🍓 🍦') : (thermalRealist ? '★ ★ ★' : '⭐ ⭐ ⭐')}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-[8px]">
                      <div className="flex justify-between"><span>1x Frappé</span><span>$45</span></div>
                      <div className="flex justify-between"><span>2x Donas</span><span>$30</span></div>
                    </div>

                    <div className="border-t border-dashed border-gray-300 mt-2 pt-2 text-center">
                      <p className="font-bold text-[10px]">TOTAL: $75</p>
                      {ticketConfig.ticket_decoration !== 'none' && (
                        <div className={`text-[10px] mt-2 border-t border-b border-gray-100 py-1 ${thermalRealist ? '' : 'bg-gray-50/50'}`}>
                          {ticketConfig.ticket_decoration === 'hearts' ? (thermalRealist ? '♥ ♥ ♥' : '❤️ ❤️ ❤️') :
                            ticketConfig.ticket_decoration === 'desserts' ? (thermalRealist ? '※ ※ ※' : '🍰 🍓 🍦') : (thermalRealist ? '★ ★ ★' : '⭐ ⭐ ⭐')}
                        </div>
                      )}
                      {ticketConfig.ticket_show_slogan && <p className="text-[7px] italic mt-2">"{businessData.eslogan}"</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

          {activeTab === "pagos" && (
            <div className="grid lg:grid-cols-1 gap-6">
              <div className="bg-white border border-pink-50 rounded-[32px] p-6 shadow-xl shadow-pink-100/10 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                    <FaUniversity size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Datos de Transferencia</h3>
                    <p className="text-xs text-gray-400 font-bold italic tracking-tighter">Estos datos se mostrarán en el Menú Digital al cliente.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { key: "banco_nombre", label: "Nombre del Banco", placeholder: "Ej: BBVA, Banorte, HSBC…" },
                    { key: "banco_titular", label: "Nombre del Titular", placeholder: "Ej: Juan Pérez López" },
                    { key: "banco_cuenta", label: "Número de Cuenta", placeholder: "Ej: 1234567890" },
                    { key: "banco_clabe", label: "CLABE Interbancaria", placeholder: "18 dígitos" },
                    { key: "banco_concepto", label: "Concepto de Pago sugerido", placeholder: "Ej: Pedido Pecadito..." }
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{label}</label>
                      <input
                        type="text"
                        placeholder={placeholder}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 outline-none focus:border-indigo-300 transition-all font-bold text-gray-700"
                        value={bancoForm[key]}
                        onChange={(e) => setBancoForm({ ...bancoForm, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0 font-black">?</div>
                  <p className="text-[11px] text-blue-800 font-medium leading-relaxed italic">
                    Asegúrate de que los datos sean correctos. El cliente podrá copiarlos directamente desde su celular para realizar el pago de su orden digital.
                  </p>
                </div>

                <button
                  onClick={handleSaveEverything}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <FaSave /> Guardar Configuración de Pagos
                </button>
              </div>
            </div>
          )}

          {activeTab === "integraciones" && (
            <div className="grid lg:grid-cols-1 gap-6">
              <div className="bg-white border border-pink-50 rounded-[32px] p-6 shadow-xl shadow-pink-100/5 space-y-5">
                <div className="flex items-center gap-3">
                  <FaTelegramPlane size={20} className="text-blue-500" />
                  <h3 className="text-lg font-black uppercase text-gray-800 tracking-tight">Alertas Móviles</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Telegram Token</label>
                    <input
                      type="password"
                      placeholder="000:AAAHHH..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 outline-none focus:border-blue-300 transition-all font-mono text-[10px]"
                      value={telegramConfig.token}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, token: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Chat / Group ID</label>
                    <input
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 outline-none focus:border-blue-300 transition-all font-mono text-[10px]"
                      value={telegramConfig.chatId}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3 pt-2">
                  <button
                    onClick={handleTestTelegram}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                  >
                    <FaTelegramPlane /> Probar Telegram
                  </button>
                  <button
                    onClick={handleSendStockAlert}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-pink-100 transition-all flex items-center justify-center gap-2"
                  >
                    <FaTelegramPlane /> Enviar alerta de stock
                  </button>
                  <p className="text-[11px] text-gray-400 font-semibold self-center">
                    Usa la prueba para validar el bot y el otro botón para mandar el estado real del stock actual.
                  </p>
                </div>

                <div className="border-t border-pink-50 pt-5 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-600">Limpieza de Historial de Alertas</h4>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                      <label className="flex items-center justify-between text-[11px] font-black text-gray-700 uppercase tracking-wider">
                        Borrado automático
                        <input
                          type="checkbox"
                          checked={alertCleanupConfig.autoCleanup}
                          onChange={(e) => setAlertCleanupConfig((prev) => ({ ...prev, autoCleanup: e.target.checked }))}
                          className="w-4 h-4 accent-pink-600"
                        />
                      </label>
                      <p className="text-[11px] text-gray-500 font-semibold">Si está activo, se borran alertas antiguas según los días configurados.</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Días de retención</label>
                      <input
                        type="number"
                        min="1"
                        value={alertCleanupConfig.retentionDays}
                        onChange={(e) =>
                          setAlertCleanupConfig((prev) => ({
                            ...prev,
                            retentionDays: e.target.value === '' ? '' : Math.max(1, Number(e.target.value))
                          }))
                        }
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-pink-300 transition-all font-bold text-xs"
                      />
                      <p className="text-[11px] text-gray-500 font-semibold">Ejemplo: 30 elimina registros con más de 30 días.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="bg-pink-50 border border-pink-100 rounded-2xl p-3">
                      <p className="text-[10px] uppercase font-black text-pink-600">Registros</p>
                      <p className="text-xl font-black text-gray-800">{alertLogStats.total}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
                      <p className="text-[10px] uppercase font-black text-blue-600">Envíos Acumulados</p>
                      <p className="text-xl font-black text-gray-800">{alertLogStats.sentCountTotal}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3">
                      <p className="text-[10px] uppercase font-black text-gray-600">Último Envío</p>
                      <p className="text-xs font-black text-gray-800 mt-1">
                        {alertLogStats.lastSentAt ? new Date(alertLogStats.lastSentAt).toLocaleString('es-MX') : 'Sin registros'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <button
                      onClick={fetchAlertLogStats}
                      className="bg-white border border-gray-200 hover:border-pink-200 text-gray-700 px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                      Refrescar historial
                    </button>
                    <button
                      onClick={handleClearAlertLog}
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      <FaTrash /> Limpiar historial manual
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "equipo" && (
            <div className="grid lg:grid-cols-1 gap-6">
              <div className="bg-white border border-pink-50 rounded-[32px] p-6 shadow-xl shadow-pink-100/5 space-y-5 h-fit">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase text-gray-800 tracking-tight">Gestionar Equipo</h3>
                  <input
                    type="text"
                    placeholder="Filtro..."
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-1.5 outline-none focus:border-pink-300 transition-all font-bold text-[10px] w-32"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                  {usuariosFiltrados.map((usuario) => (
                    <div key={usuario.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center font-black text-[10px]">{usuario.nombre_usuario?.substring(0, 2).toUpperCase()}</div>
                        <div>
                          <p className="text-xs font-black text-gray-800">{usuario.nombre_usuario}</p>
                          <p className="text-[8px] text-gray-400 font-bold uppercase">{usuario.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleClickDeleteUser(usuario.id)} className="p-2 text-red-400 hover:text-red-600"><FaTrash size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmación para cambios de seguridad */}
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-md z-[200] p-4">
              <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md border-2 border-pink-50 animate-slide-up">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter text-center mb-6">Autorizar Cambios</h2>
                <form onSubmit={onSubmit} className="space-y-6">
                  <input
                    type="password"
                    required
                    {...register('contraseña')}
                    placeholder="Ingresa clave maestra"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-center font-bold outline-none focus:border-pink-300 transition-all font-mono"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setShowModal(false)} className="bg-gray-100 text-gray-500 font-black py-4 rounded-2xl uppercase text-[10px]">Cancelar</button>
                    <button type="submit" className="bg-pink-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] shadow-lg shadow-pink-100">Confirmar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {activeTab === "seguridad" && Number(user?.is_super_admin) === 1 && (
            <div className="grid lg:grid-cols-1 gap-6 pb-20">
              <div className="bg-white border-2 border-pink-100 rounded-[35px] p-7 shadow-2xl shadow-pink-100/20 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-50 rounded-full blur-3xl opacity-50"></div>

                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3">
                    <FaCog size={22} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">Perfil Maestro</h3>
                    <p className="text-[9px] text-pink-500 font-bold uppercase tracking-[0.2em]">Gestión de Acceso Súper Admin</p>
                  </div>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                }} className="space-y-4 relative z-10">

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                      <input
                        name="nombre"
                        type="text"
                        defaultValue={user.nombre}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-pink-500 focus:bg-white transition-all font-bold text-gray-800 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Maestro</label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={user.email}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-pink-500 focus:bg-white transition-all font-bold text-gray-800 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-pink-500 uppercase tracking-widest ml-1">Nueva Contraseña (Opcional)</label>
                    <input
                      name="nuevaContraseña"
                      type="password"
                      placeholder="Dejar vacío para mantener"
                      className="w-full bg-pink-50/30 border-2 border-pink-50 rounded-xl px-4 py-2.5 outline-none focus:border-pink-500 focus:bg-white transition-all font-bold text-gray-800 text-sm"
                    />
                  </div>

                  <div className="bg-gray-900 rounded-[25px] p-5 text-white shadow-xl relative overflow-hidden group border border-gray-800">
                    <div className="absolute inset-0 bg-pink-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <label className="text-[9px] font-black text-pink-300 uppercase tracking-[0.2em] block mb-2 font-mono">Verificar Identidad</label>
                        <input
                          name="contraseñaActual"
                          type="password"
                          required
                          placeholder="Contraseña actual"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-pink-400 focus:bg-white/10 transition-all font-bold text-white text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        onClick={async (e) => {
                          e.preventDefault();
                          const form = e.target.closest('form');
                          const formData = new FormData(form);
                          const data = {
                            nombre: formData.get('nombre'),
                            email: formData.get('email'),
                            contraseña: formData.get('nuevaContraseña'),
                            contraseñaActual: formData.get('contraseñaActual')
                          };

                          if (!data.contraseñaActual) {
                            return Swal.fire("Seguridad", "Escribe tu contraseña actual.", "warning");
                          }

                          Swal.fire({ title: 'Actualizando...', didOpen: () => Swal.showLoading() });

                          try {
                            await actualizarMiPerfil(data);
                            Swal.fire({ title: "¡Éxito!", text: "Perfil actualizado.", icon: "success", confirmButtonColor: "#db2777" });
                            form.reset();
                          } catch (err) {
                            Swal.fire("Error", err.response?.data?.message || "Contraseña incorrecta.", "error");
                          }
                        }}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 self-end md:self-auto h-fit"
                      >
                        <FaCheck /> Guardar Perfil
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
};

      export default ConfiguracionPOS;

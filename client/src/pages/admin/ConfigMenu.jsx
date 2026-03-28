import { useState } from "react";
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
} from "react-icons/fa";
import Swal from "sweetalert2";

const ConfigMenu = () => {
  const negocioSeleccionado = JSON.parse(localStorage.getItem("negocioSeleccionado"));

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

  return (
    <div className="flex-1 bg-pink-50/50">
      <main className="p-3 sm:p-4 md:p-6">
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
                    Tu tienda abierta 24/7 para pedidos en linea.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-widest">
                    <span className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full border border-pink-100 inline-flex items-center gap-2">
                      <FaStore /> {negocioSeleccionado?.nombre || "Sucursal"}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 inline-flex items-center gap-2">
                      <FaClipboardList /> Menu activo
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <a
                  href="/inventario"
                  className="bg-pink-600 text-white px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-pink-700 transition-all shadow-lg shadow-pink-100"
                >
                  Gestionar productos
                </a>
                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white text-pink-600 border-2 border-pink-100 px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-pink-50 transition-all shadow-sm inline-flex items-center gap-2"
                >
                  <FaExternalLinkAlt size={10} /> Ver menu
                </a>
              </div>
            </div>
          </header>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <section className="bg-white rounded-[24px] p-4 md:p-5 border border-pink-100 shadow-md shadow-pink-100/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
                  <FaLink />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 tracking-tight">Enlace del Menú</h3>
                  <p className="text-xs text-gray-400 font-semibold">
                    Comparte por WhatsApp, Instagram o redes.
                  </p>
                </div>
              </div>

              <div className="bg-pink-50 border border-pink-100 rounded-2xl p-3 md:p-4 mb-4">
                <p className="text-[11px] font-black text-pink-700 break-all select-all">{menuUrl}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className={`w-full py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                    copied
                      ? "bg-green-500 text-white shadow-green-100"
                      : "bg-[#db2777] text-white shadow-pink-100 hover:scale-[1.01]"
                  }`}
                >
                  {copied ? (
                    <>
                      <FaCheckCircle size={14} /> Copiado
                    </>
                  ) : (
                    <>
                      <FaLink size={14} /> Copiar enlace
                    </>
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
                  <h3 className="font-black text-gray-800 tracking-tight">Codigo QR</h3>
                  <p className="text-xs text-gray-400 font-semibold">
                    Imprime y colocalo en mesas y mostrador.
                  </p>
                </div>
              </div>

              <div className="w-full bg-pink-50 rounded-3xl p-4 border border-pink-100 flex items-center justify-center">
                <img src={qrImageUrl} alt="QR menú digital" className="w-44 h-44 object-contain rounded-xl" />
              </div>

              <button
                onClick={handleDownloadQR}
                className="mt-4 w-full bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-100"
              >
                <FaDownload size={12} /> Descargar QR (PNG)
              </button>
            </section>
          </div>

          <footer className="mt-5 pt-4 border-t border-pink-100 text-center">
            <div className="flex justify-center gap-4 text-pink-300 opacity-50 mb-4">
              <FaHeart /> <FaHeart /> <FaHeart />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">
              {negocioSeleccionado?.nombre || "Sucursal"} - Sucursal activa
            </p>
            <p className="text-[9px] text-gray-300 font-medium">
              © 2026 Pecadito - Los postres más frescos de la red.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default ConfigMenu;

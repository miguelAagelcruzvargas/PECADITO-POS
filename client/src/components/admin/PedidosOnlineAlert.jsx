import { useState, useEffect } from "react";
import axios from "../../api/axios";
import { FaBell } from "react-icons/fa";
import Swal from "sweetalert2";

const PedidosOnlineAlert = () => {
  const [pedidos, setPedidos] = useState([]);
  const [lastCount, setLastCount] = useState(0);
  const idNegocio = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;

  const fetchPedidos = async () => {
    if (!idNegocio) return;
    try {
      const res = await axios.get(`/pedidos-digitales/${idNegocio}`);
      setPedidos(res.data);
      
      if (res.data.length > lastCount) {
        // Notificación sonora simple
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
        audio.play();
        Swal.fire({
          title: "¡Nuevo Pedido Online!",
          text: `Tienes ${res.data.length} pedidos pendientes por confirmar.`,
          icon: "info",
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false
        });
      }
      setLastCount(res.data.length);
    } catch (e) {
      console.error("Error fetching online orders", e);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 10000); // Polling cada 10 seg
    return () => clearInterval(interval);
  }, [idNegocio, lastCount]);

  if (pedidos.length === 0) return null;

  return (
    <div className="relative group cursor-pointer" onClick={() => window.location.href='/pedidos'}>
      <FaBell className="text-pink-600 animate-bounce" />
      <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
        {pedidos.length}
      </span>
    </div>
  );
};

export default PedidosOnlineAlert;

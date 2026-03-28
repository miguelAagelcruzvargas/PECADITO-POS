import { useEffect, useState } from "react";
import { useInventario } from "../../context/InventarioContext";
import { FaExclamationTriangle } from "react-icons/fa";

const StockAlert = () => {
  const { inventario } = useInventario();
  const [show, setShow] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    const lowItems = inventario.filter(item => item.stock <= 10 && item.activo);
    if (lowItems.length > 0) {
      setLowStockItems(lowItems);
      setShow(true);
    } else {
      setShow(false);
    }
  }, [inventario]);

  if (!show) return null;

  return (
    <div className="fixed top-[72px] right-3 md:right-4 z-[90] animate-bounce max-w-[calc(100vw-1.5rem)] md:max-w-sm">
      <div 
        className="bg-red-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 cursor-pointer hover:bg-red-700 transition-colors"
        onClick={() => setShow(false)}
      >
        <FaExclamationTriangle className="text-2xl" />
        <div>
          <p className="font-bold">¡Stock Bajo!</p>
          <p className="text-sm">{lowStockItems.length} productos requieren atención.</p>
        </div>
        <button className="ml-2 font-bold">×</button>
      </div>
    </div>
  );
};

export default StockAlert;

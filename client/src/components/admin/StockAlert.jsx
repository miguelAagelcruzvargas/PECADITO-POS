import { useEffect, useState } from "react";
import { useInventario } from "../../context/InventarioContext";
import { FaExclamationTriangle } from "react-icons/fa";

const StockAlert = () => {
  const { alertas, getAlertasId } = useInventario();
  const [show, setShow] = useState(false);

  useEffect(() => {
    getAlertasId();
  }, []);

  useEffect(() => {
    if (alertas.length > 0) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [alertas]);

  if (!show || alertas.length === 0) return null;

  return (
    <div className="fixed top-[72px] right-3 md:right-4 z-[100] max-w-[calc(100vw-1.5rem)] md:max-w-[280px] animate-in slide-in-from-right-4 duration-500">
      <div className="bg-white border border-rose-100 rounded-3xl shadow-2xl shadow-rose-200/40 p-3.5 relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 flex-shrink-0">
            <FaExclamationTriangle size={14} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-tight">Stock bajo</h3>
            <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest leading-none">Urgente</p>
          </div>
          <button onClick={() => setShow(false)} className="ml-auto text-gray-300 hover:text-rose-500 font-bold transition-colors">×</button>
        </div>

        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
          {alertas.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-700 truncate pr-2">{item.producto}</span>
              <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md text-[9px] font-black">{item.stock}</span>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setShow(false)}
          className="w-full mt-3 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 transition-all active:scale-95"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default StockAlert;

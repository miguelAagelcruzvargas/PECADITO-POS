// src/components/LowStockAlert.jsx
import { useEffect, useState } from "react";

export default function LowStockAlert({ items = [], negocioId, onClose }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
  if (Array.isArray(items) && items.length > 0) {
    setOpen(true);        // siempre la abre si hay items
  } else {
    setOpen(false);
  }
}, [items, negocioId]);

  if (!open || items.length === 0) return null;

  const cerrar = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <div
      className="
        fixed top-[76px] right-3 md:right-4 z-[85] w-[92vw] max-w-sm
        transition-all duration-300 ease-out translate-y-3 opacity-0
        data-[open=true]:translate-y-0 data-[open=true]:opacity-100
      "
      data-open={open}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-xl p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.516 11.593c.75 1.335-.213 3.008-1.743 3.008H3.484c-1.53 0-2.493-1.673-1.743-3.008L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd"/>
            </svg>
          </div>

          <div className="ml-3 min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-yellow-900">Stock bajo</h3>
            <p className="mt-1 text-sm text-yellow-800">
              Los siguientes productos están por agotarse:
            </p>

            <div className="mt-2 max-h-40 overflow-auto">
              <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-900">
                {items.map(i => (
                  <li key={i.id}>
                    {i.producto} <span className="font-medium">({i.stock})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={cerrar}
            className="ml-3 text-yellow-700 hover:text-yellow-900"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

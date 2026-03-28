import { useEffect } from "react";
import Grafica from "../../components/admin/GraficaDash";
import { useVentas } from "../../context/VentasContext";
import { useClientes } from "../../context/ClientesContext";
import { usePedidos } from "../../context/PedidosContext";
import { useInventario } from "../../context/InventarioContext";
import LowStockAlert from "../LowStockAlert";

import TurnoControl from "../../components/admin/TurnoControl";

export default function Dashboard() {

  const { getTopProductosMes, masvendidos, totalGeneral, getTotalGeneral } = useVentas();

  const { getValorid, clientes } = useClientes();

  const { getValorid: getValoridPedidos, pedidos } = usePedidos();

  const { getValorid: getValoridInventario, inventario, getAlertasId, alertas } = useInventario();

  useEffect(() => {
    getTopProductosMes();
    getTotalGeneral();
    getValorid();
    getValoridPedidos();
    getValoridInventario();
    getAlertasId()
  }, []);

  console.log(alertas);

  return (
    <div className="px-3 py-4 sm:px-4 md:p-6 space-y-4 md:space-y-6">
      <LowStockAlert items={alertas} />
      <h2 className="text-2xl md:text-3xl font-bold text-green-900">Bienvenid@</h2>
      
      <TurnoControl />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Ventas Totales" value={`$ ${totalGeneral.toLocaleString()}`} change="+12.5%" />
        <Card title="Clientes" value={clientes.length.toLocaleString()} change="+3.2%" />
        <Card title="Pedidos" value={pedidos.length.toLocaleString()} change="+8.1%" />
        <Card title="Inventario" value={inventario.length.toLocaleString()} change="-2.3%" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-green-800 font-bold mb-2">Ventas Recientes</h3>
          <p className="text-sm text-gray-500">Ventas de los últimos 30 días</p>
          <div className="w-full flex items-center justify-center py-4">
            <Grafica />
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-green-800 font-bold mb-2">Productos Más Vendidos</h3>
          <ul className="text-sm">
            {masvendidos.length > 0 ? (
              masvendidos.map((item, index) => (
                <li key={index} className="flex justify-between py-2 border-b border-gray-400 last:border-b-0 text-md">
                  {item.nombre_producto}
                  <span className="text-green-600 font-semibold">
                    {item.total_vendido} unidades
                  </span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-center">No hay datos disponibles</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, change }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="text-gray-600">{title}</p>
      <h3 className="text-green-800 text-xl font-bold">{value}</h3>
    </div>
  );
}

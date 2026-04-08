import { FaChartLine, FaBoxes, FaTruck, FaClipboardList, FaWallet } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import TurnoControl from '../admin/TurnoControl';

const Card = ({ title, description, Icon, link }) => (
  <Link to={link} className="block bg-white rounded-[2rem] shadow-xl shadow-green-100/30 p-8 w-full hover:shadow-2xl hover:scale-[1.02] transition-all border border-green-50 group">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-black text-green-700 tracking-tighter">{title}</h2>
      <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-500">
        <Icon className="text-2xl" />
      </div>
    </div>
    <p className="text-gray-400 font-medium italic text-sm">{description}</p>
  </Link>
);

export default function DashboardCards() {
  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <header className="mb-2">
         <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Mi Panel de Trabajo</h1>
         <p className="text-gray-500 font-medium italic">Gestiona tus ventas y pedidos del día.</p>
      </header>

      <TurnoControl />

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Cobrar"
          description="Ir a la caja y registrar nuevas ventas."
          Icon={FaChartLine}
          link='/ventas'
        />
        <Card
          title="Stock"
          description="Ver existencias de productos y toppings."
          Icon={FaBoxes}
          link='/inventario'
        />
        <Card
          title="Insumos"
          description="Registrar pedidos a tus proveedores."
          Icon={FaTruck}
          link='/proveedores'
        />
        <Card
          title="Pedidos"
          description="Gestionar pedidos online de clientes."
          Icon={FaClipboardList}
          link='/pedidos'
        />
        <Card
          title="Caja"
          description="Registrar ingresos y egresos de efectivo."
          Icon={FaWallet}
          link='/gestion-caja'
        />
      </div>
    </div>
  );
}

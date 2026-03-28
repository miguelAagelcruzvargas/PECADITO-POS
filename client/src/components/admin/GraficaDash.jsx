import { useEffect } from "react";
import { useVentas } from "../../context/VentasContext";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const GraficaVentas = () => {

  const { getGraficaDashboards, graficaDashboards } = useVentas();

  useEffect(() => {
    getGraficaDashboards();
  }, []);

  return (
    <div className="w-full h-70 bg-white rounded-xl">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={graficaDashboards}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="total_ventas"
            stroke="#3b82f6"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraficaVentas;

import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

import NegociosRoutes from "./routes/negocios.routes.js";
import UsuariosRoutes from "./routes/usuarios.routes.js";
import ClientesRoutes from "./routes/clientes.routes.js";
import ProveedoresRoutes from "./routes/proveedores.routes.js";
import InventarioRoutes from "./routes/inventario.routes.js";
import PedidosRoutes from "./routes/pedidos.routes.js";
import GastosRoutes from "./routes/gastos.routes.js";
import VentasRoutes from "./routes/ventas.routes.js";
import ToppingsRoutes from "./routes/toppings.routes.js";
import TurnosRoutes from "./routes/turnos.routes.js";
import PedidosDigitalesRoutes from "./routes/pedidos_digitales.routes.js";
import MetricsRoutes from "./routes/metrics.routes.js";
import ConfigAppRoutes from "./routes/configuracion.routes.js";
import InsumosRoutes from "./routes/insumos.routes.js";

const app = express();

app.use(cors({
    origin: "http://localhost:5000",
    credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use('/public', express.static('public'));
app.use('/uploads', express.static('public'));

app.use("/api", NegociosRoutes);
app.use("/api", UsuariosRoutes);
app.use("/api", ClientesRoutes);
app.use("/api", ProveedoresRoutes);
app.use("/api", InventarioRoutes);
app.use("/api", PedidosRoutes);
app.use("/api", GastosRoutes);
app.use("/api", VentasRoutes);
app.use("/api", ToppingsRoutes);
app.use("/api", TurnosRoutes);
app.use("/api", PedidosDigitalesRoutes);
app.use("/api", MetricsRoutes);
app.use("/api", ConfigAppRoutes);
app.use("/api", InsumosRoutes);

export default app;
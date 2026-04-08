import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDash from "./pages/admin/Dashboard";
import PanelGlobalDetalle from "./pages/admin/PanelGlobalDetalle";
import NegocioAdmin from "./pages/admin/Negocio";
import Usuarios from "./pages/admin/Usuarios";
import Clientes from "./pages/admin/Clientes";
import Inventario from "./pages/admin/Inventario";
import Proveedores from "./pages/admin/Proveedor";
import Ventas from "./pages/admin/Ventas";
import HistorialVentas from "./pages/admin/HistorialVentas";
import Pedidos from "./pages/admin/Pedidos";
import Gastos from "./pages/admin/Gastos";
import Configuracion from "./pages/admin/Configuracion";
import Reportes from "./pages/admin/Reportes";
import PuntosDeVenta from "./pages/admin/PuntosDeVenta";
import Toppings from "./pages/admin/Toppings.jsx";
import ConfigMenu from "./pages/admin/ConfigMenu.jsx";
import Empleados from "./pages/admin/Empleados.jsx";
import GestionCaja from "./pages/admin/GestionCaja.jsx";
import ProtectedRoute from "./ProtecteRoute";
import AdminLayout from "./components/admin/AdminLayout";
import MenuDigital from "./pages/MenuDigital";
import CambiarContrasena from "./pages/CambiarContrasena";
import GlobalNetworkLoader from "./components/common/GlobalNetworkLoader";
import { NegociosProvider } from "./context/NegociosContext";
import { AuthProvider } from "./context/UsuariosContext";
import { ClientesProvider } from "./context/ClientesContext";
import { ProveedoresProvider } from "./context/ProveedoresContext";
import { InventarioProvider } from "./context/InventarioContext";
import { PedidosProvider } from "./context/PedidosContext";
import { GastosProvider } from "./context/GastosContext";
import { VentasProvider } from "./context/VentasContext";
import { ToppingsProvider } from "./context/ToppingsContext";

import { TurnoProvider } from "./context/TurnoContext";

function App() {
  return (
    <BrowserRouter>
      <GlobalNetworkLoader />
      <ClientesProvider>
        <PedidosProvider>
          <ToppingsProvider>
            <TurnoProvider>
              <ProveedoresProvider>
                <GastosProvider>
                  <NegociosProvider>
                    <VentasProvider>
                      <InventarioProvider>
                        <AuthProvider>
                          <Routes>
                            <Route path="/" element={<Login />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/menu/:id_negocio" element={<MenuDigital />} />
                            <Route path="/menu" element={<MenuDigital />} />
                            <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />
                            <Route element={<ProtectedRoute />}>
                              <Route path="/administrador" element={<AdminDash />} />
                              <Route path="/panel-global-detalle" element={<PanelGlobalDetalle />} />
                              <Route element={<AdminLayout />}>
                                <Route path="/dashboard" element={<NegocioAdmin />} />
                                <Route path="/usuarios" element={<Usuarios />} />
                                <Route path="/clientes" element={<Clientes />} />
                                <Route path="/inventario" element={<Inventario />} />
                                <Route path="/proveedores" element={<Proveedores />} />
                                <Route path="/ventas" element={<Ventas />} />
                                <Route path="/historial-ventas" element={<HistorialVentas />} />
                                <Route path="/pedidos" element={<Pedidos />} />
                                <Route path="/gastos" element={<Gastos />} />
                                <Route path="/configuraciones" element={<Configuracion />} />
                                <Route path="/toppings" element={<Toppings />} />
                                <Route path="/config-menu" element={<ConfigMenu />} />
                                <Route path="/reportes" element={<Reportes />} />
                                <Route path="/puntos-de-venta" element={<PuntosDeVenta />} />
                                <Route path="/empleados" element={<Empleados />} />
                                <Route path="/gestion-caja" element={<GestionCaja />} />
                              </Route>
                            </Route>
                            <Route path="*" element={<Login />} />
                          </Routes>
                        </AuthProvider>
                      </InventarioProvider>
                    </VentasProvider>
                  </NegociosProvider>
                </GastosProvider>
              </ProveedoresProvider>
            </TurnoProvider>
          </ToppingsProvider>
        </PedidosProvider>
      </ClientesProvider>
    </BrowserRouter>
  )
}

export default App
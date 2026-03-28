import Dashboard from "../../components/admin/Dashboard";
import EmpleadoDash from "../../components/empleado/Dashboard.Emp";
import { useAuth } from "../../context/UsuariosContext";

function NegocioPage() {
  const { user } = useAuth();

  if (user.role === 'Administrador') {
    return <Dashboard />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-green-50">
      <EmpleadoDash />
    </div>
  );
}

export default NegocioPage;

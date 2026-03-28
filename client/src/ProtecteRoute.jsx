import { useAuth } from "./context/UsuariosContext";
import { Navigate, Outlet } from 'react-router-dom';
import FresaLoader from "./components/common/FresaLoader";

function ProtectedRoute() {

    const {loading, isAuthenticated} = useAuth();

        if (loading) {
            return (
                <FresaLoader
                    title="Entrando al sistema"
                    subtitle="Verificando tu sesión"
                />
            );
        }
    if (!loading && !isAuthenticated) return <Navigate to='/' replace />
    
    return <Outlet />;
}

export default ProtectedRoute;
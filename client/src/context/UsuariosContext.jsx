import { createContext, useContext, useEffect, useState } from 'react'
import { loginRequest, verifyTokenRequest, logoutRequest, ObtenerUsuarios, registerRequest, ConfirmacionRequest, DeleteRequest, ActualizarUsuario, ActualizarPerfil, ObtenerValoresPorId } from "../api/usuarios.js";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export const AuthProvider = ({children}) => {

    const [user, setUser] = useState([]);
    const [users, setUsers] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verificacion, setVerificacion] = useState(true)

    const getValorid = async () => {
        try {
            const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
            const res = await ObtenerValoresPorId(id);
            if (!Array.isArray(res.data)) {
                setUsers([res.data]); // Lo metes en un array
            } else {
                setUsers(res.data); // Ya es una lista
            }
        } catch (error) {
            console.log(error);
            if(error.status === 404){
                setUsers([]);
            }
        }
    }

    const signup = async (user) => {
        try {
            await registerRequest(user);
            // Importante: no cambiar la sesión autenticada actual al crear otro usuario.
            await getUsuarios();
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al registrar usuario"]);
            console.log(error);
        }
    }

    const signin = async (user) => {
        try {
            const res = await loginRequest(user);
            const userData = res.data;
            setUser(userData);
            localStorage.setItem("usuario", JSON.stringify(userData));
            
            // Si el usuario pertenece a un negocio específico, lo configuramos automáticamente
            if (userData.negocios_id) {
                // Necesitamos los detalles del negocio. 
                // Como no tenemos una función directa aquí, podemos intentar buscarlo en la lista de negocios?
                // O mejor, el login ya debería traer esos detalles si actualizamos el backend.
                // Por ahora, configuramos lo básico.
                localStorage.setItem("negocioSeleccionado", JSON.stringify({
                    id: userData.negocios_id,
                    nombre: userData.nombre_negocio || 'Mi Sucursal'
                }));
            }

            setIsAuthenticated(true);
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al iniciar sesión"]);
        }
    }

    const logout = async () => {
        Cookies.remove('token');
        setIsAuthenticated(false);
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
    }

    const getUsuarios = async () => {
        try {
            const res = await ObtenerUsuarios();
            setUsers(res.data.data);
        } catch (error) {
            console.log(error);
        }
    }

    const confirm = async (user) => {
        try {
            const res = await ConfirmacionRequest(user);
            setVerificacion(res);
        } catch (error) {
            setErrors([error.response.data.message]);
        }
    }

    const eliminarUsuario = async (id) => {
        try {
            const res = await DeleteRequest(id);
            if (res.status === 204) setUsers(negocios.filter((negocio) => negocio._id !== id))
        } catch (error) {
            console.log(error);
        }
    }

    const actualizarUsuario = async (id, data) => {
            try {
                const res = await ActualizarUsuario(id, data);
                getUsuarios();
                getValorid();
                return res.data;
            } catch (error) {
                console.error("Error al actualizar el usuario", error);
                throw error;
            }
    };

    const actualizarMiPerfil = async (data) => {
        const currentUserId = user?.id || JSON.parse(localStorage.getItem("usuario"))?.id;
        if (!currentUserId) throw new Error("No hay sesión activa");

        const res = await ActualizarPerfil(currentUserId, data);
        const updatedUser = res?.data?.user;

        if (updatedUser) {
            setUser(updatedUser);
            localStorage.setItem("usuario", JSON.stringify(updatedUser));
        }

        return res.data;
    };

    useEffect(() => {
        if (errors.length > 0) {
            const timer = setTimeout(() => {
                setErrors([])
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [errors]);

    useEffect(() => {
        async function checkLogin () {
            const cookies = Cookies.get();

            if (!cookies.token) {
                setIsAuthenticated(false)
                setLoading(false)
                return setUser(null)
            }

            try {
                const res = await verifyTokenRequest(cookies.token);
                if (!res.data) {
                    setIsAuthenticated(false)
                    setLoading(false);
                    return
                }

                setIsAuthenticated(true)
                setUser(res.data)
                setLoading(false)
            } catch (error) {
                setIsAuthenticated(false)
                setUser(null)
                setLoading(false)
            }
        }

        checkLogin();
    }, []);

    return (
        <AuthContext.Provider value={{
            signup,
            signin,
            logout,
            getUsuarios,
            confirm,
            eliminarUsuario,
            actualizarUsuario,
            actualizarMiPerfil,
            getValorid,
            verificacion,
            loading,
            user,
            isAuthenticated,
            errors,
            users
        }}>
            {children}
        </AuthContext.Provider>
    )

}
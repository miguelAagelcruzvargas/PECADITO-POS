import { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axios";
import { crearTopping, obtenerToppings, eliminarTopping } from "../api/toppings";

const ToppingsContext = createContext();

export const useToppings = () => {
  const context = useContext(ToppingsContext);
  if (!context) throw new Error("useToppings must be used within a ToppingsProvider");
  return context;
};

export const ToppingsProvider = ({ children }) => {
  const [toppings, setToppings] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const getToppings = async (negocioIdParam) => {
    try {
      const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const negocioId = negocioIdParam || id || usuario?.negocios_id;
      
      if (!negocioId) return;
      
      const res = await obtenerToppings(negocioId);
      setToppings(Array.isArray(res.data) ? res.data : []);
      
      // También obtenemos las categorías
      const resCat = await axios.get(`/toppings-categorias/${negocioId}`);
      setCategorias(Array.isArray(resCat.data) ? resCat.data : []);
    } catch (error) {
      console.error("Error al obtener toppings/categorias:", error);
      setToppings([]);
      setCategorias([]);
    }
  };

  const create = async (topping) => {
    try {
      await crearTopping(topping);
      getToppings();
    } catch (error) {
      console.error(error);
    }
  };

  const createCategoria = async (nombre, negocioId) => {
    try {
        await axios.post(`/toppings-categorias`, { nombre, negocio_id: negocioId });
        getToppings();
    } catch (error) {
        console.error(error);
    }
  }

  const removeCategoria = async (id) => {
    try {
        await axios.delete(`/toppings-categorias/${id}`);
        getToppings();
    } catch (error) {
        console.error(error);
    }
  }

  const remove = async (id) => {
    try {
      await eliminarTopping(id);
      getToppings();
    } catch (error) {
      console.error(error);
    }
  };

  const update = async (id, data) => {
    try {
      await axios.put(`/toppings/${id}`, data);
      getToppings();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getToppings();
  }, []);

  return (
    <ToppingsContext.Provider value={{ 
      toppings, 
      categorias, 
      getToppings, 
      create, 
      remove, 
      update,
      createCategoria, 
      removeCategoria 
    }}>
      {children}
    </ToppingsContext.Provider>
  );
};

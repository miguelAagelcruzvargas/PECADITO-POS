import { createContext, useContext, useState, useEffect } from "react";
import { crearTopping, obtenerToppings, eliminarTopping } from "../api/toppings";

const ToppingsContext = createContext();

export const useToppings = () => {
  const context = useContext(ToppingsContext);
  if (!context) throw new Error("useToppings must be used within a ToppingsProvider");
  return context;
};

export const ToppingsProvider = ({ children }) => {
  const [toppings, setToppings] = useState([]);

  const getToppings = async (negocioIdParam) => {
    try {
      const id = JSON.parse(localStorage.getItem("negocioSeleccionado"))?.id;
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const negocioId = negocioIdParam || id || usuario?.negocios_id;
      
      // Si no hay id de negocio ni usuario, no hacemos nada
      if (!negocioId) return;
      
      const res = await obtenerToppings(negocioId);
      setToppings(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener toppings:", error);
      setToppings([]);
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

  const remove = async (id) => {
    try {
      await eliminarTopping(id);
      getToppings();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getToppings();
  }, []);

  return (
    <ToppingsContext.Provider value={{ toppings, getToppings, create, remove }}>
      {children}
    </ToppingsContext.Provider>
  );
};

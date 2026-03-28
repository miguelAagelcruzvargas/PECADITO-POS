import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const TurnoContext = createContext();

export const useTurno = () => useContext(TurnoContext);

export const TurnoProvider = ({ children }) => {
  const [turnoActual, setTurnoActual] = useState(null);

  const checkTurnoActivo = async () => {
    try {
      const res = await axios.get('/turnos/activos');
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      const miTurno = res.data.find(t => t.usuario_id === usuario?.id);
      setTurnoActual(miTurno || null);
    } catch (e) {
      console.error(e);
    }
  };

  const iniciarTurno = async (montoInicial) => {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      const res = await axios.post('/turnos/iniciar', { 
        usuario_id: usuario.id,
        monto_inicial: montoInicial 
      });
      setTurnoActual({ id: res.data.id, usuario_id: usuario.id, monto_inicial: montoInicial });
      return res.data;
    } catch (e) {
      throw e;
    }
  };

  const cerrarTurno = async () => {
    try {
      await axios.post('/turnos/cerrar', { id: turnoActual.id });
      setTurnoActual(null);
    } catch (e) {
      throw e;
    }
  };

  useEffect(() => {
    checkTurnoActivo();
  }, []);

  return (
    <TurnoContext.Provider value={{ turnoActual, iniciarTurno, cerrarTurno, checkTurnoActivo }}>
      {children}
    </TurnoContext.Provider>
  );
};

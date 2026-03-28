import * as Gastos from "../models/gastos.model.js";

// Crear un nuevo gasto
export const crear = async (req, res) => {
  const { motivo, costo, recibio, id_negocio } = req.body;

  try {
    if (!motivo || !costo || !recibio) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const gasto = { motivo, costo, recibio, id_negocio };

    Gastos.createGasto(gasto, (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Error al crear el gasto", error });
      }

      res.status(201).json({ gasto });
    });

  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};

// Obtener uno por relacion
export const obtenerValoresid = (req, res) => {
  const { id } = req.params;
  Gastos.getGastoById(id, (err, result) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error al obtener el valor' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'valor no encontrado' });
    }

  res.json(result);
  });
};

// Eliminar gasto
export const eliminar = (req, res) => {
  const { id } = req.params;
  if(!id) return res.status(400).json({ message: 'ID requerido' });
  Gastos.deleteGasto(id, (err, result) => {
    if (err) {
      console.error('Error al eliminar gasto:', err);
      return res.status(500).json({ message: 'Error al eliminar gasto' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Gasto no encontrado' });
    res.json({ message: 'Gasto eliminado' });
  });
};
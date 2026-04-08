import * as Toppings from "../models/toppings.model.js";
import db from "../db.js";

export const crear = async (req, res) => {
  try {
    const { nombre, precio, negocio_id, categoria_id } = req.body;
    if (!nombre || precio === undefined || !negocio_id) {
      return res.status(400).json({ message: "Todos los campos básicos son obligatorios" });
    }

    Toppings.createTopping({ nombre, precio, negocio_id, categoria_id }, (err, result) => {
      if (err) return res.status(500).json({ message: "Error al crear topping", err });
      
      const toppingId = result.insertId;
      const { insumo_id, cantidad_por_unidad } = req.body;
      
      if (insumo_id && cantidad_por_unidad) {
        // Guardar receta
        db.query('INSERT INTO receta_topping_insumo (topping_id, insumo_id, cantidad_por_unidad) VALUES (?, ?, ?)', 
        [toppingId, insumo_id, cantidad_por_unidad], (errRec) => {
           if (errRec) console.error("Error al guardar receta base:", errRec);
        });
      }

      res.status(201).json({ message: "Topping creado correctamente" });
    });
  } catch (error) {
    res.status(500).json({ message: "Error interno", error });
  }
};

export const obtener = async (req, res) => {
  const { negocio_id } = req.params;
  Toppings.getToppingsByNegocio(negocio_id, (err, results) => {
    if (err) return res.status(500).json({ message: "Error al obtener toppings", err });
    res.json(results);
  });
};

export const eliminar = async (req, res) => {
  const { id } = req.params;
  Toppings.deleteTopping(id, (err, result) => {
    if (err) return res.status(500).json({ message: "Error al eliminar topping", err });
    res.json({ message: "Topping eliminado" });
  });
};

export const actualizar = async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria_id } = req.body;
  Toppings.updateTopping(id, { nombre, precio, categoria_id }, (err) => {
    if (err) return res.status(500).json({ message: "Error al actualizar topping", err });
    
    const { insumo_id, cantidad_por_unidad } = req.body;
    
    // Actualizar receta
    db.query('DELETE FROM receta_topping_insumo WHERE topping_id = ?', [id], () => {
        if (insumo_id && cantidad_por_unidad) {
            db.query('INSERT INTO receta_topping_insumo (topping_id, insumo_id, cantidad_por_unidad) VALUES (?, ?, ?)',
            [id, insumo_id, cantidad_por_unidad]);
        }
    });

    res.json({ message: "Topping actualizado" });
  });
};

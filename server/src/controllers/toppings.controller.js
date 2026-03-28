import * as Toppings from "../models/toppings.model.js";

export const crear = async (req, res) => {
  try {
    const { nombre, precio, negocio_id } = req.body;
    if (!nombre || precio === undefined || !negocio_id) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    Toppings.createTopping({ nombre, precio, negocio_id }, (err, result) => {
      if (err) return res.status(500).json({ message: "Error al crear topping", err });
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

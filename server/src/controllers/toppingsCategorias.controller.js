import * as Categoria from "../models/toppingsCategorias.model.js";

export const crear = async (req, res) => {
  const { nombre, negocio_id } = req.body;
  if (!nombre || !negocio_id) return res.status(400).json({ message: "Nombre y negocio_id obligatorios" });

  Categoria.createCategoria({ nombre, negocio_id }, (err, result) => {
    if (err) return res.status(500).json({ message: "Error al crear categoría", err });
    res.status(201).json({ message: "Categoría creada correctamente", id: result.insertId });
  });
};

export const obtener = async (req, res) => {
  const { negocio_id } = req.params;
  Categoria.getCategoriasByNegocio(negocio_id, (err, results) => {
    if (err) return res.status(500).json({ message: "Error al obtener categorías", err });
    res.json(results);
  });
};

export const actualizar = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  Categoria.updateCategoria(id, { nombre }, (err) => {
    if (err) return res.status(500).json({ message: "Error al actualizar categoría", err });
    res.json({ message: "Categoría actualizada" });
  });
};

export const eliminar = async (req, res) => {
  const { id } = req.params;
  Categoria.deleteCategoria(id, (err) => {
    if (err) return res.status(500).json({ message: "Error al eliminar categoría", err });
    res.json({ message: "Categoría eliminada" });
  });
};

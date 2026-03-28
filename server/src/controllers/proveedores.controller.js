import * as Proveedores from "../models/proveedores.model.js";

// Crear un nuevo cliente
export const crear = async (req, res) => {
  const { nombre, telefono, id_negocio } = req.body;

  try {
    if (!nombre || !telefono) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const proveedor = { nombre, telefono, id_negocio };

    Proveedores.createProveedor(proveedor, (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Error al crear el proveedor", error });
      }

      if (result.existe) {
        return res.status(409).json({ message: "El proveedor ya está registrado" });
      }

      res.status(201).json({ proveedor });
    });

  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};

// Obtener todos los clientes
export const obtener = async (req, res) => {
  try {
    Proveedores.ObtenerProveedores((error, results) => {
      if (error) {
        console.error("Error al obtener proveedores:", error);
        return res.status(500).json({ message: "Error al obtener los proveedores", error });
      }

      res.status(200).json({ data: results });
    });
  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};

// Obtener uno por relacion
export const obtenerValoresid = (req, res) => {
  const { id } = req.params;
  Proveedores.getValoresById(id, (err, result) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error al obtener el valor' });
    }

    // Si no hay proveedores para la sucursal, devolvemos lista vacía (no es error).
    res.status(200).json(Array.isArray(result) ? result : []);
  });
};

// Eliminar proveedor
export const eliminar = (req, res) => {
  const { id } = req.params;
  if(!id) return res.status(400).json({ message: 'ID requerido' });
  Proveedores.deleteProveedor(id, (err, result) => {
    if (err) {
      console.error('Error al eliminar proveedor:', err);
      return res.status(500).json({ message: 'Error al eliminar proveedor' });
    }
    if(result.affectedRows === 0){
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    res.json({ message: 'Proveedor eliminado' });
  });
};
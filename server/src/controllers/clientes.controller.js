import * as Clientes from "../models/clientes.model.js";

// Crear un nuevo cliente
export const crear = async (req, res) => {
  const { nombre, celular, email, curp, negocio_id } = req.body;

  try {
    if (!nombre || negocio_id === undefined || negocio_id === null || negocio_id === "") {
      return res.status(400).json({ message: "Faltan campos: nombre, celular, email, curp, negocio_id" });
    }

    const negocioIdNum = Number(negocio_id);
    if (isNaN(negocioIdNum)) {
      return res.status(400).json({ message: "negocio_id debe ser numérico" });
    }

  const cliente = { nombre, celular, email, curp, negocio_id: negocioIdNum };

    Clientes.createCliente(cliente, (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Error al crear el CLIENTE", error });
      }

      // Verifica si el modelo respondió que ya existe
      if (result.existe) {
        return res.status(409).json({ message: "El cliente ya está registrado" });
      }

      res.status(201).json({ cliente });
    });

  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};

// Obtener todos los clientes
export const obtener = async (req, res) => {
  try {
    Clientes.ObtenerClientes((error, results) => {
      if (error) {
        console.error("Error al obtener negocios:", error);
        return res.status(500).json({ message: "Error al obtener los negocios", error });
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
  Clientes.getValoresById(id, (err, result) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error al obtener los clientes' });
    }
    // Devuelve lista (vacía si no hay) para evitar 404 en frontend
    return res.status(200).json(result);
  });
};

// Obtener uno por ID
export const obtenerUno = (req, res) => {
  const { id } = req.params;
  Clientes.getNegocioById(id, (error, result) => {
    if (error) return res.status(500).json({ message: "Error al obtener el negocio", error });
    if (result.length === 0) return res.status(404).json({ message: "Negocio no encontrado" });
    res.status(200).json({ data: result[0] });
  });
};

// Actualizar un cliente
export const actualizar = (req, res) => {
  const { id } = req.params;
  const { nombre, celular, curp, email } = req.body;

  const data = { nombre, celular, curp, email };

  Clientes.updateCliente(id, data, (error, result) => {

    if (error) return res.status(500).json({ message: "Error al actualizar el negocio", error });

    res.status(200).json({ message: "Cliente actualizado correctamente" });
  });

};

// Eliminar un cliente
export const eliminar = (req, res) => {
  const { id } = req.params;

  Clientes.deleteNegocio(id, (error, result) => {
    if (error) return res.status(500).json({ message: "Error al eliminar el Cliente", error });
  return res.status(200).json({ message: 'Cliente eliminado' });
  });
};
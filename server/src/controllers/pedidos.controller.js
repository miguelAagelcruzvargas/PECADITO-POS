import * as Pedidos from "../models/pedidos.model.js";
import * as Inventario from "../models/inventario.model.js";

// Crear un nuevo pedido
export const crear = async (req, res) => {
  const { proveedor, producto, presentacion, cantidad, negocio_id } = req.body;

  try {
    if (!proveedor || !producto || !presentacion || !cantidad) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const pedido = { proveedor, producto, presentacion, cantidad, negocio_id };

    Pedidos.createPedido(pedido, (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Error al crear el pedido", error });
      }

      // Verifica si el modelo respondió que ya existe
      if (result.existe) {
        return res.status(409).json({ message: "⚠️ El pedido ya está registrado" });
      }

      res.status(201).json({ pedido });
    });

  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};

// Obtener uno por relacion
export const obtenerValoresid = (req, res) => {
  const { id } = req.params;
  Pedidos.getPedidoById(id, (err, result) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error al obtener el valor' });
    }

    res.json(result || []);
  });
};

// Eliminar un pedido
export const eliminar = (req, res) => {
  const { id } = req.params;

  Pedidos.deletePedido(id, (error, result) => {
    if (error) return res.status(500).json({ message: "Error al eliminar el pedido", error });
    res.status(200).json({ message: "Pedido eliminado correctamente" });
  });
};

export const obtenerValoresdeUnPedido = (req, res) => {
    const { id } = req.params;

    Pedidos.GetUnPedido(id, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: 'Error al obtener el valor' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Valor no encontrado' });
        }

        const productoData = result[0];

        Inventario.getValoresPorUno(productoData.producto, productoData.presentacion, (error, stockResult) => {
            if (error) {
                console.error('Error al obtener el stock:', error);
                return res.status(500).json({ message: 'Error al obtener el stock' });
            }

            if (stockResult.length === 0) {
                return res.status(404).json({ message: 'Stock no encontrado' });
            }

            const stock = stockResult[0].stock;
            const totalStock = stock + productoData.cantidad;

            // Actualizamos el stock
            Inventario.updateStock(productoData.producto, productoData.presentacion, totalStock, (error) => {
                if (error) {
                    console.error("Error al actualizar el stock:", error);
                    return res.status(500).json({ message: 'Error al actualizar el stock' });
                }

                // Eliminamos el pedido
                Pedidos.deletePedido(id, (error) => {
                    if (error) {
                        return res.status(500).json({ message: "Error al eliminar el pedido", error });
                    }

                    // ✅ Solo enviamos UNA respuesta
                    return res.status(200).json({
                        message: "Pedido eliminado y stock actualizado correctamente",
                        producto: productoData.producto,
                        presentacion: productoData.presentacion,
                        stockActualizado: totalStock
                    });
                });
            });
        });
    });
};


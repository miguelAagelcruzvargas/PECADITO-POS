import * as Inventario from "../models/inventario.model.js";
import TelegramService from '../services/TelegramService.js';

// Crear un nuevo producto
export const crear = async (req, res) => {
  try {
    const { producto, proveedor, presentacion, precio, stock, negocio_id, categoria } = req.body;

    // Validación básica
    if (!req.file || !producto || !presentacion || !precio || !stock || !negocio_id) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Convertir a valores numéricos
    const precioNum = parseFloat(precio);
    const stockNum = parseInt(stock);
    const negocioId = parseInt(negocio_id);

    if (isNaN(precioNum) || isNaN(stockNum) || isNaN(negocioId)) {
      return res.status(400).json({ message: "Precio, stock y negocio deben ser valores numéricos válidos" });
    }

    // Ruta relativa para la imagen
    const imagen = `/public/${req.file.filename}`;

    // Objeto listo para guardar en la base de datos
    const productoGenerado = {
      imagen,
      producto,
      proveedor: (proveedor || 'Sin proveedor').trim(),
      presentacion,
      precio: precioNum,
      stock: stockNum,
      negocio_id: negocioId,
      categoria: categoria || 'General'
    };

    // Inserción a la base de datos
    Inventario.createInventario(productoGenerado, (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Error al crear el producto", error });
      }

      if (result?.existe) {
        return res.status(409).json({ message: "⚠️ El producto ya está registrado" });
      }

      res.status(201).json({ producto: productoGenerado });
    });

  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};

// Obtener todos los negocios
export const obtener = async (req, res) => {
  try {
    Inventario.ObtenerInventario((error, results) => {
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
  Inventario.getValoresById(id, (err, result) => {
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

// Eliminar un producto
export const eliminar = (req, res) => {
  const { id } = req.params;
  const idNumber = Number(id);

  // Verificar dependencias (detalle_venta)
  Inventario.countDetallesVenta(idNumber, (err, conteo) => {
    if (err) return res.status(500).json({ message: 'Error al verificar dependencias', err });

    if (conteo > 0) {
      // Soft delete si hay ventas
      Inventario.softDeleteInventario(idNumber, (error, result) => {
        if (error) return res.status(500).json({ message: "Error al eliminar (soft) el producto", error });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado' });
        return res.status(200).json({ message: "Producto marcado como inactivo (tiene ventas asociadas)" });
      });
    } else {
      // Borrado duro si no tiene ventas
      Inventario.deleteInventario(idNumber, (error, result) => {
        if (error) return res.status(500).json({ message: "Error al eliminar el producto", error });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado' });
        return res.status(200).json({ message: 'Producto eliminado definitivamente (sin ventas asociadas)' });
      });
    }
  });
};

// Restaurar (reactivar) producto
export const restaurar = (req, res) => {
  const { id } = req.params;
  const idNumber = Number(id);
  Inventario.restoreInventario(idNumber, (error, result) => {
    if (error) return res.status(500).json({ message: 'Error al restaurar el producto', error });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado' });
    res.status(200).json({ message: 'Producto reactivado' });
  });
};

// Actualizar un producto
export const actualizar = (req, res) => {
  const { id } = req.params;
  const idNumber = Number(id);
  
  // Si viene una imagen nueva, la procesamos
  const updateData = { ...req.body };
  if (req.file) {
    updateData.imagen = `/public/${req.file.filename}`;
  }

  Inventario.updateInventario(idNumber, updateData, (error, result) => {
    if (error) return res.status(500).json({ message: "Error al actualizar el producto", error });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado' });
    res.status(200).json({ message: 'Producto actualizado con éxito' });
  });
};

export function productosStockBajo(req, res) {
  const negocioId = Number(req.params.id);
  if (!negocioId) return res.status(400).json({ message: 'negocio_id inválido' });

  Inventario.getProductosStockBajo(negocioId, (err, rows) => {
    if (err) {
      console.error('Stock bajo err:', err);
      return res.status(500).json({ message: 'Error al obtener productos' });
    }

    if ((rows || []).length > 0) {
      TelegramService.sendLowStockAlert(negocioId, rows).catch((telegramError) => {
        console.error('Error enviando alerta de stock bajo desde inventario:', telegramError?.message || telegramError);
      });
    }

    res.json(rows || []);
  });
}
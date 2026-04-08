import * as Inventario from "../models/inventario.model.js";
import db from "../db.js";
import TelegramService from '../services/TelegramService.js';

// Crear un nuevo producto
export const crear = async (req, res) => {
  try {
    const { 
      producto, proveedor, presentacion, precio, stock, negocio_id, categoria,
      toppings_incluidos, liquidos_incluidos, toppings_fijos_ids,
      insumo_id, cantidad_insumo
    } = req.body;

    // Validación básica
    if (!req.file || !producto || !presentacion || !precio || !stock || !negocio_id) {
      return res.status(400).json({ message: "Todos los campos básicos son obligatorios" });
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
      categoria: categoria || 'General',
      toppings_incluidos: parseInt(toppings_incluidos) || 0,
      liquidos_incluidos: parseInt(liquidos_incluidos) || 0
    };

    // Inserción a la base de datos
    Inventario.createInventario(productoGenerado, (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Error al crear el producto", error });
      }

      if (result?.existe) {
        return res.status(409).json({ message: "⚠️ El producto ya está registrado" });
      }

      const inventarioId = result.insertId;
      
      // Guardar toppings fijos si vienen
      let fixedToppings = [];
      try {
        fixedToppings = typeof toppings_fijos_ids === 'string' ? JSON.parse(toppings_fijos_ids) : (toppings_fijos_ids || []);
      } catch (e) {
        fixedToppings = [];
      }

      // Vincular insumo principal (receta)
      if (insumo_id && cantidad_insumo) {
          db.query('INSERT INTO receta_producto_insumo (producto_id, insumo_id, cantidad_por_unidad) VALUES (?, ?, ?)',
          [inventarioId, insumo_id, cantidad_insumo], (errRec) => {
              if (errRec) console.error("Error al vincular insumo a producto:", errRec);
          });
      }

      if (fixedToppings.length > 0) {
        Inventario.saveFixedToppings(inventarioId, fixedToppings, (errF) => {
          if (errF) console.error("Error al guardar toppings fijos:", errF);
          res.status(201).json({ producto: { ...productoGenerado, id: inventarioId } });
        });
      } else {
        res.status(201).json({ producto: { ...productoGenerado, id: inventarioId } });
      }
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

export const obtenerToppingsFijos = (req, res) => {
  const { id } = req.params;
  Inventario.getFixedToppings(id, (err, result) => {
    if (err) return res.status(500).json({ message: 'Error al obtener toppings fijos', err });
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

  // Eliminar campos que NO pertenecen a la tabla inventario directamente
  delete updateData.toppings_fijos_ids;
  delete updateData.insumo_id;
  delete updateData.cantidad_insumo;
  delete updateData.negocio_id; // No permitimos cambiar el negocio del producto

  Inventario.updateInventario(idNumber, updateData, (error, result) => {
    if (error) return res.status(500).json({ message: "Error al actualizar el producto", error });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado' });

    // Actualizar toppings fijos si vienen en el body
    if (req.body.toppings_fijos_ids !== undefined) {
      let fixedToppings = [];
      try {
        fixedToppings = typeof req.body.toppings_fijos_ids === 'string' ? JSON.parse(req.body.toppings_fijos_ids) : (req.body.toppings_fijos_ids || []);
      } catch (e) {
        fixedToppings = [];
      }
      
      Inventario.saveFixedToppings(idNumber, fixedToppings, (errF) => {
        if (errF) console.error("Error al actualizar toppings fijos:", errF);
        
        // Actualizar receta de producto
        const { insumo_id, cantidad_insumo } = req.body;
        db.query('DELETE FROM receta_producto_insumo WHERE producto_id = ?', [idNumber], () => {
             if (insumo_id && cantidad_insumo) {
                 db.query('INSERT INTO receta_producto_insumo (producto_id, insumo_id, cantidad_por_unidad) VALUES (?, ?, ?)',
                 [idNumber, insumo_id, cantidad_insumo]);
             }
        });

        res.status(200).json({ message: 'Producto actualizado con éxito' });
      });
    } else {
        // Actualizar receta de producto inclusive si no hay toppings fijos
        const { insumo_id, cantidad_insumo } = req.body;
        if (insumo_id !== undefined) {
          db.query('DELETE FROM receta_producto_insumo WHERE producto_id = ?', [idNumber], () => {
               if (insumo_id && cantidad_insumo) {
                   db.query('INSERT INTO receta_producto_insumo (producto_id, insumo_id, cantidad_por_unidad) VALUES (?, ?, ?)',
                   [idNumber, insumo_id, cantidad_insumo]);
               }
          });
        }
        res.status(200).json({ message: 'Producto actualizado con éxito' });
    }
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
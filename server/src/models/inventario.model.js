import db, { triggerSyncUpdate } from '../db.js';

// Crear puntos de venta
export const createInventario = (data, callback) => {
  const sql = 'INSERT INTO inventario (imagen, producto, presentacion, proveedor, precio, stock, negocio_id, categoria, mostrar_en_menu, toppings_incluidos, liquidos_incluidos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [
    data.imagen, 
    data.producto, 
    data.presentacion, 
    data.proveedor, 
    data.precio, 
    data.stock, 
    data.negocio_id, 
    data.categoria, 
    data.mostrar_en_menu || 0,
    data.toppings_incluidos || 0,
    data.liquidos_incluidos || 0
  ];
  db.query(sql, values, (err, res) => {
    if (!err) {
      import('../db.js').then(m => m.triggerSyncUpdate(data.negocio_id));
    }
    callback(err, res);
  });
};

// Actualizar un producto
export const updateInventario = (id, data, callback) => {
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return callback(null, { affectedRows: 0 });

  const sql = `UPDATE inventario SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);
  db.query(sql, values, (err, res) => {
    if (!err) {
      import('../db.js').then(m => m.triggerSyncUpdate(data.negocio_id));
    }
    callback(err, res);
  });
};

// Obtener solo para el menú digital (que estén activos y marcados para mostrar)
export const getDigitalMenu = (negocioId, callback) => {
  const sql = 'SELECT * FROM inventario WHERE negocio_id = ? AND activo = 1 AND mostrar_en_menu = 1';
  db.query(sql, [negocioId], callback);
};

// Obtener valores por id
export const getValoresById = (id, callback) => {
  const sql = `
  SELECT * FROM inventario WHERE negocio_id = ? AND activo = 1
  `;
  db.query(sql, [id], callback);
};

// Eliminar un producto por ID
export const deleteInventario = (id, callback) => {
  db.query('SELECT negocio_id FROM inventario WHERE id = ?', [id], (errN, rows) => {
    const nid = (!errN && rows.length > 0) ? rows[0].negocio_id : null;
    const sqlDelete = 'DELETE FROM inventario WHERE id = ?';
    db.query(sqlDelete, [id], (err, res) => {
      if (!err && nid) triggerSyncUpdate(nid);
      callback(err, res);
    });
  });
};

// Soft delete: marca el producto como inactivo
export const softDeleteInventario = (id, callback) => {
  const sql = 'UPDATE inventario SET activo = 0 WHERE id = ?';
  db.query(sql, [id], callback);
};

// Restaurar (reactivar) un producto previamente inactivado
export const restoreInventario = (id, callback) => {
  const sql = 'UPDATE inventario SET activo = 1 WHERE id = ?';
  db.query(sql, [id], callback);
};

// Verificar si existen detalles de venta asociados a un producto
export const countDetallesVenta = (id, callback) => {
  const sql = 'SELECT COUNT(*) AS conteo FROM detalle_venta WHERE producto_id = ?';
  db.query(sql, [id], (err, rows) => {
    if (err) return callback(err);
    const conteo = rows?.[0]?.conteo || 0;
    callback(null, conteo);
  });
};

// Obtener valores de uno (los que estan activos)
export const getValoresPorUno = (producto, presentacion, callback) => {
  const sql = `
  SELECT stock FROM inventario WHERE producto = ? AND presentacion = ?
  `;
  db.query(sql, [producto, presentacion], callback);
};

export const updateStock = (producto, presentacion, nuevoStock, callback) => {
    const sql = `
        UPDATE inventario 
        SET stock = ? 
        WHERE producto = ? AND presentacion = ?
    `;
    db.query(sql, [nuevoStock, producto, presentacion], (err, result) => {
        if (!err) {
            db.query('SELECT negocio_id FROM inventario WHERE producto = ? AND presentacion = ?', [producto, presentacion], (errN, rows) => {
                if (!errN && rows.length > 0) triggerSyncUpdate(rows[0].negocio_id);
            });
        }
        callback(err, result);
    });
};

export function getProductosStockBajo(negocioId, callback) {
  const sql = `
    SELECT id, imagen, producto, presentacion, proveedor, precio, stock, activo, negocio_id
    FROM inventario
    WHERE activo = 1 AND stock <= 10 AND negocio_id = ?
  `;
  db.query(sql, [negocioId], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
}

/**
 * Guarda la relación de toppings fijos (incluidos) para un producto de inventario
 */
export const saveFixedToppings = (inventarioId, toppingsIds, callback) => {
  db.query('DELETE FROM inventario_toppings_fijos WHERE inventario_id = ?', [inventarioId], (err) => {
    if (err) return callback(err);
    if (!toppingsIds || toppingsIds.length === 0) return callback(null);
    
    // Asegurarse de que son IDs únicos y válidos
    const uniqueIds = [...new Set(toppingsIds)].filter(id => id);
    if (uniqueIds.length === 0) return callback(null);

    const values = uniqueIds.map(tid => [inventarioId, tid]);
    db.query('INSERT INTO inventario_toppings_fijos (inventario_id, topping_id) VALUES ?', [values], callback);
  });
};

/**
 * Obtiene los toppings fijos de un producto
 */
export const getFixedToppings = (inventarioId, callback) => {
  const sql = `
    SELECT t.*, tc.nombre as categoria_nombre
    FROM toppings t
    LEFT JOIN toppings_categorias tc ON t.categoria_id = tc.id
    JOIN inventario_toppings_fijos itf ON t.id = itf.topping_id
    WHERE itf.inventario_id = ?
  `;
  db.query(sql, [inventarioId], callback);
};
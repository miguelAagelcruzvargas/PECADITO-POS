import db from '../db.js'; // ya no ejecutes connectDB()

// Crear puntos de venta
export const createInventario = (data, callback) => {
  const sql = 'INSERT INTO inventario (imagen, producto, presentacion, proveedor, precio, stock, negocio_id, categoria, mostrar_en_menu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [data.imagen, data.producto, data.presentacion, data.proveedor, data.precio, data.stock, data.negocio_id, data.categoria, data.mostrar_en_menu || 0];
  db.query(sql, values, callback);
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
  db.query(sql, values, callback);
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
  // Borrado duro,Se deja por compatibilidad si alguien lo llama sino va a dar un moton de errores.
  // aunque, podriamos ussarlo por si quiere una limpieza de todo
  const sql = 'DELETE FROM inventario WHERE id = ?';
  db.query(sql, [id], callback);
};

// Soft delete: marca el producto como inactivo
export const softDeleteInventario = (id, callback) => {
  const sql = 'UPDATE inventario SET activo = 0 WHERE id = ?';
  db.query(sql, [id], callback);
};

// Restaurar (reactivar) un producto previamente inactivado (esto es por si acaso quieres poner un metodo para los productos inactivos)
export const restoreInventario = (id, callback) => {
  const sql = 'UPDATE inventario SET activo = 1 WHERE id = ?';
  db.query(sql, [id], callback);
};

// Verificar si existen detalles de venta asociados a un producto (sino tiene una venta asociada pues los borra de forma permanente)
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
        if (err) {
            console.error("❌ Error al actualizar el stock:", err);
            return callback(err, null);
        }
        callback(null, result);
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
    callback(null, rows); // éxito
  });
}
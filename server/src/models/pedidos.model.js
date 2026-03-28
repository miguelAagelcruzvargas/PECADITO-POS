import db from '../db.js';

// Crear puntos de venta
export const createPedido = (data, callback) => {
  const sql = 'INSERT INTO pedidos (proveedor, producto, presentacion, cantidad, negocio_id ) VALUES (?, ?, ?, ?, ?)';
  const values = [data.proveedor, data.producto, data.presentacion, data.cantidad, data.negocio_id];
  db.query(sql, values, callback);
};

// Obtener un solo negocio por ID
export const getPedidoById = (id, callback) => {
  const sql = 'SELECT * FROM pedidos WHERE negocio_id = ?';
  db.query(sql, [id], callback);
};

// Eliminar un pedido por ID
export const deletePedido = (id, callback) => {
  const sql = 'DELETE FROM pedidos WHERE no_pedido = ?';
  db.query(sql, [id], callback);
};

// Obtener un solo negocio por ID
export const GetUnPedido = (id, callback) => {
  const sql = 'SELECT producto, presentacion, cantidad FROM pedidos WHERE no_pedido = ?';
  db.query(sql, [id], callback);
};
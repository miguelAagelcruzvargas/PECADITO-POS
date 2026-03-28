import db from '../db.js';

export const createTopping = (data, callback) => {
  const sql = 'INSERT INTO toppings (nombre, precio, negocio_id) VALUES (?, ?, ?)';
  const values = [data.nombre, data.precio, data.negocio_id];
  db.query(sql, values, callback);
};

export const getToppingsByNegocio = (negocioId, callback) => {
  const sql = 'SELECT * FROM toppings WHERE negocio_id = ? AND activo = 1';
  db.query(sql, [negocioId], callback);
};

export const updateTopping = (id, data, callback) => {
  const sql = 'UPDATE toppings SET nombre = ?, precio = ? WHERE id = ?';
  db.query(sql, [data.nombre, data.precio, id], callback);
};

export const deleteTopping = (id, callback) => {
  const sql = 'UPDATE toppings SET activo = 0 WHERE id = ?';
  db.query(sql, [id], callback);
};

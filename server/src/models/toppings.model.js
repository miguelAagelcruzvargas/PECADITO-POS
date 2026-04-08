import db from '../db.js';

export const createTopping = (data, callback) => {
  const sql = 'INSERT INTO toppings (nombre, precio, negocio_id, categoria_id) VALUES (?, ?, ?, ?)';
  const values = [data.nombre, data.precio, data.negocio_id, data.categoria_id];
  db.query(sql, values, callback);
};

export const getToppingsByNegocio = (negocioId, callback) => {
  const sql = `
    SELECT t.*, tc.nombre as categoria_nombre 
    FROM toppings t
    LEFT JOIN toppings_categorias tc ON t.categoria_id = tc.id
    WHERE t.negocio_id = ? AND t.activo = 1
  `;
  db.query(sql, [negocioId], callback);
};

export const updateTopping = (id, data, callback) => {
  const sql = 'UPDATE toppings SET nombre = ?, precio = ?, categoria_id = ? WHERE id = ?';
  db.query(sql, [data.nombre, data.precio, data.categoria_id, id], callback);
};

export const deleteTopping = (id, callback) => {
  const sql = 'UPDATE toppings SET activo = 0 WHERE id = ?';
  db.query(sql, [id], callback);
};

import db from '../db.js';

export const createCategoria = (data, callback) => {
  const sql = 'INSERT INTO toppings_categorias (nombre, negocio_id) VALUES (?, ?)';
  db.query(sql, [data.nombre, data.negocio_id], callback);
};

export const getCategoriasByNegocio = (negocioId, callback) => {
  const sql = 'SELECT * FROM toppings_categorias WHERE negocio_id = ? ORDER BY nombre ASC';
  db.query(sql, [negocioId], callback);
};

export const updateCategoria = (id, data, callback) => {
  const sql = 'UPDATE toppings_categorias SET nombre = ? WHERE id = ?';
  db.query(sql, [data.nombre, id], callback);
};

export const deleteCategoria = (id, callback) => {
  const sql = 'DELETE FROM toppings_categorias WHERE id = ?';
  db.query(sql, [id], callback);
};

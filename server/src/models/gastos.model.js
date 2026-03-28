import db from '../db.js';

// Crear puntos de venta
export const createGasto = (data, callback) => {
  const sql = 'INSERT INTO gastos (motivo, costo, recibio, id_negocio ) VALUES (?, ?, ?, ?)';
  const values = [data.motivo, data.costo, data.recibio, data.id_negocio];
  db.query(sql, values, callback);
};

// Obtener un solo negocio por ID
export const getGastoById = (id, callback) => {
  const sql = 'SELECT * FROM gastos WHERE id_negocio = ?;';
  db.query(sql, [id], callback);
};

// Eliminar gasto por ID
export const deleteGasto = (id, callback) => {
  const sql = 'DELETE FROM gastos WHERE id = ?';
  db.query(sql, [id], callback);
};
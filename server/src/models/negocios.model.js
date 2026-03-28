import db from '../db.js'; // ya no ejecutes connectDB()

// Crear puntos de venta
export const createNegocio = (data, callback) => {
  const sql = 'INSERT INTO negocios (nombre, ubicacion, tipo, rfc, eslogan, logo) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [data.nombre, data.ubicacion, data.tipo, data.rfc, data.eslogan, data.logo];
  db.query(sql, values, callback);
};

// Obtener todos los negocios
export const ObtenerNegocios = (callback) => {
  const sql = 'SELECT * FROM negocios';
  db.query(sql, callback);
};

// Obtener un solo negocio por ID
export const getNegocioById = (id, callback) => {
  const sql = 'SELECT * FROM negocios WHERE id = ?';
  db.query(sql, [id], callback);
};

// Actualizar un negocio
export const updateNegocio = (id, data, callback) => {
  const sql = 'UPDATE negocios SET nombre = ?, ubicacion = ?, tipo = ?, rfc = ?, eslogan = ?, logo = ? WHERE id = ?';
  const values = [data.nombre, data.ubicacion, data.tipo, data.rfc, data.eslogan, data.logo, id];
  db.query(sql, values, callback);
};

// Eliminar un negocio
export const deleteNegocio = (id, callback) => {
  const sql = 'DELETE FROM negocios WHERE id = ?';
  db.query(sql, [id], callback);
};
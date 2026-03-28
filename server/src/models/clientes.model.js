import db from '../db.js'; // ya no ejecutes connectDB()

// Crear puntos de venta
export const createCliente = (data, callback) => {
  const sql = 'INSERT INTO clientes (nombre, celular, email, curp, negocio_id) VALUES (?, ?, ?, ?, ?)';
  const values = [data.nombre, data.celular, data.email, data.curp, data.negocio_id];
  db.query(sql, values, callback);
};

// Obtener todos los negocios
export const ObtenerClientes = (callback) => {
  const sql = 'SELECT c.id, c.nombre, c.celular, c.email, c.curp, c.created_at, n.nombre AS nombre_negocio FROM clientes c LEFT JOIN negocios n ON c.negocio_id = n.id;';
  db.query(sql, callback);
};

// Obtener valores por id
export const getValoresById = (id, callback) => {
  const sql = `
  SELECT c.id, c.nombre, c.celular, c.email, c.curp, c.created_at, 
  n.nombre AS nombre_negocio FROM clientes c LEFT JOIN negocios n ON c.negocio_id = n.id
  WHERE c.negocio_id = ? AND activo = 1
  `;
  db.query(sql, [id], callback);
};

// Obtener un solo negocio por ID
export const getNegocioById = (id, callback) => {
  const sql = 'SELECT * FROM clientes WHERE id = ?';
  db.query(sql, [id], callback);
};

// Actualizar un negocio
export const updateCliente = (id, data, callback) => {
  const sql = 'UPDATE clientes SET nombre = ?, celular = ?, email = ?, curp = ? WHERE id = ?';
  const values = [data.nombre, data.celular, data.email, data.curp, id];
  db.query(sql, values, callback);
};

// Eliminar un negocio
export const deleteNegocio = (id, callback) => {
  const sql = 'UPDATE clientes SET activo = 0 WHERE id = ?';
  db.query(sql, [id], callback);
};
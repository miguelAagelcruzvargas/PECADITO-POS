import db from '../db.js'; // ya no ejecutes connectDB()

// Crear proveedor
export const createProveedor = (data, callback) => {
  const sql = 'INSERT INTO proveedores (nombre, telefono, id_negocio) VALUES (?, ?, ?)';
  const values = [data.nombre, data.telefono, data.id_negocio];
  db.query(sql, values, callback);
};

// Obtener todos los negocios
export const ObtenerProveedores = (callback) => {
  const sql = 'SELECT * FROM proveedores';
  db.query(sql, callback);
};

// Obtener valores por id
export const getValoresById = (id, callback) => {
  const sql = `
    SELECT * FROM proveedores WHERE proveedores.id_negocio = ?
  `;
  db.query(sql, [id], callback);
};

// Eliminar proveedor por id
export const deleteProveedor = (id, callback) => {
  const sql = 'DELETE FROM proveedores WHERE id = ?';
  db.query(sql, [id], callback);

};

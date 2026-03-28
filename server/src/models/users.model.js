import db from '../db.js'; // ya no ejecutes connectDB()

// Crear puntos de venta
export const createUsuario = (data, callback) => {
  const sql = 'INSERT INTO usuarios (nombre, email, role, contraseña, negocios_id, permisos, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [data.nombre, data.email, data.role, data.contraseña, data.negocios_id, data.permisos, data.must_change_password ?? 1];
  db.query(sql, values, callback);
};

// Obtener todos los usuarios
export const ObtenerUsuarios = (callback) => {
  const sql = 'SELECT u.id, u.nombre AS nombre_usuario, u.email, u.role, u.permisos, u.created_at, u.is_logged_in, n.nombre AS nombre_negocio FROM usuarios u LEFT JOIN negocios n ON u.negocios_id = n.id;';
  db.query(sql, callback);
};

// Obtener valores por id
export const getValoresById = (id, callback) => {
  const sql = `
  SELECT u.id, u.nombre AS nombre_usuario, u.email, u.role, u.permisos, u.created_at, u.is_logged_in, 
  n.nombre AS nombre_negocio FROM usuarios u LEFT JOIN negocios n ON u.negocios_id = n.id 
  WHERE u.negocios_id = ?
  `;
  db.query(sql, [id], callback);
};

// Obtener un solo usuario por ID
export const getUsuarioById = (id) => {
  const sql = `
    SELECT u.*, n.nombre AS nombre_negocio
    FROM usuarios u
    LEFT JOIN negocios n ON u.negocios_id = n.id
    WHERE u.id = ?
  `;

  return new Promise((resolve, reject) => {
    db.query(sql, [id], (err, results) => {
      if (err) return reject(err);

      resolve(results[0]); // ✅ devuelve solo el primer usuario
    });
  });
};

// Obtener un solo usuario por Email
export const getUsuarioPorEmail = (email, callback) => {
  const sql = `
    SELECT u.*, n.nombre AS nombre_negocio
    FROM usuarios u
    LEFT JOIN negocios n ON u.negocios_id = n.id
    WHERE u.email = ?
  `;
  db.query(sql, [email], callback);
};

// Actualizar un usuario
export const updateUsuario = (id, data, callback) => {
  const sql = 'UPDATE usuarios SET contraseña = ?, must_change_password = ? WHERE id = ?';
  const values = [data.contraseña, data.must_change_password ?? 0, id];
  db.query(sql, values, callback);
};

export const updatePerfilUsuario = (id, data, callback) => {
  if (data.contraseña) {
    const sql = 'UPDATE usuarios SET nombre = ?, email = ?, contraseña = ?, must_change_password = 0 WHERE id = ?';
    const values = [data.nombre, data.email, data.contraseña, id];
    db.query(sql, values, callback);
    return;
  }

  const sql = 'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?';
  const values = [data.nombre, data.email, id];
  db.query(sql, values, callback);
};

// Eliminar un usuario
export const deleteUsuario = (id, callback) => {
  const sql = 'DELETE FROM usuarios WHERE id = ?';
  db.query(sql, [id], callback);
};

// marcar como logueado
export const marcarComoLogueado = (id, callback) => {
  const sql = 'UPDATE usuarios SET is_logged_in = true WHERE id = ?';
  db.query(sql, [id], callback);
};

// marcar como logueado
export const marcarComoLogout = (id, callback) => {
  const sql = 'UPDATE usuarios SET is_logged_in = false WHERE id = ?';
  db.query(sql, [id], callback);
};
import db from '../db.js'; // ya no ejecutes connectDB()

// Crear puntos de venta
export const createUsuario = (data, callback) => {
  const sql = 'INSERT INTO usuarios (nombre, email, role, contraseña, negocios_id, permisos, must_change_password, horario_entrada, horario_salida, tipo_turno) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [data.nombre, data.email, data.role, data.contraseña, data.negocios_id, data.permisos, data.must_change_password ?? 1, data.horario_entrada || null, data.horario_salida || null, data.tipo_turno || 'completo'];
  db.query(sql, values, callback);
};

// Obtener todos los usuarios
export const ObtenerUsuarios = (callback) => {
  const sql = `
    SELECT
      u.id,
      u.nombre AS nombre_usuario,
      u.email,
      u.role,
      u.permisos,
      u.created_at,
      u.is_logged_in,
      u.horario_entrada,
      u.horario_salida,
      u.tipo_turno,
      u.is_super_admin,
      n.nombre AS nombre_negocio
    FROM usuarios u
    LEFT JOIN negocios n ON u.negocios_id = n.id
  `;
  db.query(sql, callback);
};

// Obtener valores por id
export const getValoresById = (id, callback) => {
  const sql = `
  SELECT u.id, u.nombre AS nombre_usuario, u.email, u.role, u.permisos, u.created_at, u.is_logged_in,
  u.horario_entrada, u.horario_salida, u.tipo_turno, u.is_super_admin,
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
  const fields = [];
  const values = [];

  if (data.contraseña !== undefined) {
    fields.push('contraseña = ?');
    values.push(data.contraseña);
  }

  if (data.must_change_password !== undefined) {
    fields.push('must_change_password = ?');
    values.push(data.must_change_password);
  }

  if (data.horario_entrada !== undefined) {
    fields.push('horario_entrada = ?');
    values.push(data.horario_entrada);
  }

  if (data.horario_salida !== undefined) {
    fields.push('horario_salida = ?');
    values.push(data.horario_salida);
  }

  if (data.tipo_turno !== undefined) {
    fields.push('tipo_turno = ?');
    values.push(data.tipo_turno);
  }

  if (!fields.length) {
    return callback(new Error('No hay campos para actualizar'));
  }

  const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);
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
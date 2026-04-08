import db from '../db.js';

// Registrar un movimiento de caja (ingreso o egreso)
export const registrarMovimiento = (req, res) => {
  const { negocio_id, turno_id, usuario_id, tipo, monto, concepto } = req.body;

  if (!negocio_id || !usuario_id || !tipo || !monto || !concepto) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }
  if (!['ingreso', 'egreso'].includes(tipo)) {
    return res.status(400).json({ message: 'Tipo debe ser ingreso o egreso' });
  }
  if (parseFloat(monto) <= 0) {
    return res.status(400).json({ message: 'El monto debe ser mayor a 0' });
  }

  const sql = `INSERT INTO movimientos_caja (negocio_id, turno_id, usuario_id, tipo, monto, concepto) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [negocio_id, turno_id || null, usuario_id, tipo, parseFloat(monto), concepto], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error al registrar movimiento', err });
    res.status(201).json({ id: result.insertId, message: 'Movimiento registrado' });
  });
};

// Obtener movimientos de caja (con filtro opcional por turno)
export const getMovimientos = (req, res) => {
  const { negocio_id } = req.params;
  const { turno_id } = req.query;

  let sql = `
    SELECT m.*, u.nombre AS nombre_usuario
    FROM movimientos_caja m
    LEFT JOIN usuarios u ON u.id = m.usuario_id
    WHERE m.negocio_id = ?
  `;
  const params = [negocio_id];

  if (turno_id) {
    sql += ' AND m.turno_id = ?';
    params.push(turno_id);
  }

  sql += ' ORDER BY m.created_at DESC LIMIT 100';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error al obtener movimientos', err });
    res.json(results);
  });
};

// Balance neto de la caja para el turno activo
export const getBalance = (req, res) => {
  const { negocio_id } = req.params;
  const { turno_id } = req.query;

  const sql = `
    SELECT
      IFNULL(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) AS total_ingresos,
      IFNULL(SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END), 0) AS total_egresos,
      IFNULL(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END), 0) AS balance_neto,
      COUNT(*) AS num_movimientos
    FROM movimientos_caja
    WHERE negocio_id = ?
      ${turno_id ? 'AND turno_id = ?' : ''}
  `;
  const params = turno_id ? [negocio_id, turno_id] : [negocio_id];

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error al calcular balance', err });
    const row = results[0] || {};
    res.json({
      total_ingresos: parseFloat(row.total_ingresos || 0),
      total_egresos: parseFloat(row.total_egresos || 0),
      balance_neto: parseFloat(row.balance_neto || 0),
      num_movimientos: Number(row.num_movimientos || 0)
    });
  });
};

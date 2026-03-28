import db from '../db.js';
import TelegramService from '../services/TelegramService.js';

export const iniciarTurno = (req, res) => {
  const { usuario_id, monto_inicial } = req.body;
  const sql = 'INSERT INTO turnos (usuario_id, monto_inicial) VALUES (?, ?)';
  db.query(sql, [usuario_id, monto_inicial || 0], (err, result) => {
    if (err) return res.status(500).json({ message: "Error al iniciar turno", err });
    res.json({ id: result.insertId, monto_inicial: monto_inicial || 0, message: "Turno iniciado" });
  });
};

export const cerrarTurno = (req, res) => {
  const { id } = req.body;

  const sqlResumen = `
    SELECT
      t.id,
      u.negocios_id,
      IFNULL((
        SELECT SUM(v.total)
        FROM ventas v
        WHERE v.turno_id = t.id
          AND v.id_negocio = u.negocios_id
          AND COALESCE(v.canal_venta, 'Local') <> 'Online'
      ), 0) AS total_local,
      IFNULL((
        SELECT COUNT(*)
        FROM ventas v
        WHERE v.turno_id = t.id
          AND v.id_negocio = u.negocios_id
          AND COALESCE(v.canal_venta, 'Local') <> 'Online'
      ), 0) AS num_ventas_local,
      IFNULL((
        SELECT SUM(pd.total)
        FROM pedidos_digitales pd
        WHERE pd.status = 'Confirmado'
          AND pd.confirmado_por = t.usuario_id
          AND pd.negocio_id = u.negocios_id
          AND pd.confirmado_en BETWEEN t.inicio AND NOW()
      ), 0) AS total_online,
      IFNULL((
        SELECT COUNT(*)
        FROM pedidos_digitales pd
        WHERE pd.status = 'Confirmado'
          AND pd.confirmado_por = t.usuario_id
          AND pd.negocio_id = u.negocios_id
          AND pd.confirmado_en BETWEEN t.inicio AND NOW()
      ), 0) AS num_ventas_online
    FROM turnos t
    JOIN usuarios u ON t.usuario_id = u.id
    WHERE t.id = ?
    LIMIT 1
  `;

  db.query(sqlResumen, [id], (errResumen, rowsResumen) => {
    if (errResumen) return res.status(500).json({ message: "Error al calcular resumen de turno", errResumen });
    if (!rowsResumen.length) return res.status(404).json({ message: "Turno no encontrado" });

    const resumen = rowsResumen[0];
    const totalVentas = Number(resumen.total_local || 0) + Number(resumen.total_online || 0);

    const sqlCerrar = 'UPDATE turnos SET fin = CURRENT_TIMESTAMP, total_ventas = ? WHERE id = ?';
    db.query(sqlCerrar, [totalVentas, id], (errCerrar) => {
      if (errCerrar) return res.status(500).json({ message: "Error al cerrar turno", errCerrar });

      // Enviar resumen a Telegram de forma asíncrona
      TelegramService.sendDailySummary(resumen.negocios_id, {
        total: totalVentas,
        num_ventas: Number(resumen.num_ventas_local || 0) + Number(resumen.num_ventas_online || 0)
      });

      res.json({ message: "Turno cerrado correctamente", total_ventas: totalVentas });
    });
  });
};

export const obtenerTurnosActivos = (req, res) => {
  const sql = `
    SELECT
      t.*,
      u.nombre AS nombre_usuario,
      u.negocios_id,
      n.nombre AS nombre_negocio
    FROM turnos t
    JOIN usuarios u ON t.usuario_id = u.id
    LEFT JOIN negocios n ON n.id = u.negocios_id
    WHERE t.fin IS NULL
    ORDER BY n.nombre ASC, t.inicio DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Error", err });
    res.json(results);
  });
};

export const obtenerReporteTurno = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      t.id,
      t.inicio,
      t.fin,
      t.monto_inicial,
      t.total_ventas,
      u.nombre AS nombre_usuario,
      n.nombre AS nombre_negocio,
      IFNULL((
        SELECT COUNT(*)
        FROM ventas v
        WHERE v.turno_id = t.id
          AND v.id_negocio = u.negocios_id
          AND COALESCE(v.canal_venta, 'Local') <> 'Online'
      ), 0) AS num_ventas_local,
      IFNULL((
        SELECT SUM(v.total)
        FROM ventas v
        WHERE v.turno_id = t.id
          AND v.id_negocio = u.negocios_id
          AND COALESCE(v.canal_venta, 'Local') <> 'Online'
      ), 0) AS total_local,
      IFNULL((
        SELECT COUNT(*)
        FROM pedidos_digitales pd
        WHERE pd.status = 'Confirmado'
          AND pd.confirmado_por = t.usuario_id
          AND pd.negocio_id = u.negocios_id
          AND pd.confirmado_en BETWEEN t.inicio AND IFNULL(t.fin, NOW())
      ), 0) AS num_ventas_online,
      IFNULL((
        SELECT SUM(pd.total)
        FROM pedidos_digitales pd
        WHERE pd.status = 'Confirmado'
          AND pd.confirmado_por = t.usuario_id
          AND pd.negocio_id = u.negocios_id
          AND pd.confirmado_en BETWEEN t.inicio AND IFNULL(t.fin, NOW())
      ), 0) AS total_online
    FROM turnos t
    JOIN usuarios u ON t.usuario_id = u.id
    JOIN negocios n ON u.negocios_id = n.id
    WHERE t.id = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json(err);
    const row = results[0] || null;
    if (!row) return res.json(null);

    const totalLocal = Number(row.total_local || 0);
    const totalOnline = Number(row.total_online || 0);
    const numLocal = Number(row.num_ventas_local || 0);
    const numOnline = Number(row.num_ventas_online || 0);
    const totalVentas = totalLocal + totalOnline;

    res.json({
      ...row,
      num_ventas: numLocal + numOnline,
      total_ventas: totalVentas,
      total_caja_final: totalVentas + Number(row.monto_inicial || 0)
    });
  });
};

export const obtenerHistorialTurnos = (req, res) => {
  const { negocio_id } = req.params;
  const sql = `
    SELECT t.*, u.nombre AS nombre_usuario, n.nombre AS nombre_negocio
    FROM turnos t
    JOIN usuarios u ON t.usuario_id = u.id
    JOIN negocios n ON u.negocios_id = n.id
    WHERE u.negocios_id = ?
    ORDER BY t.inicio DESC
    LIMIT 30
  `;
  db.query(sql, [negocio_id], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

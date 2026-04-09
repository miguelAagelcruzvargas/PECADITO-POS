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
  const { id, monto_final_declarado } = req.body;

  const sqlResumen = `
    SELECT
      t.id,
      t.monto_inicial,
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
          AND pd.metodo_pago = 'transferencia'
      ), 0) AS total_transferencia,
      IFNULL((
        SELECT SUM(pd.total)
        FROM pedidos_digitales pd
        WHERE pd.status = 'Confirmado'
          AND pd.confirmado_por = t.usuario_id
          AND pd.negocio_id = u.negocios_id
          AND pd.confirmado_en BETWEEN t.inicio AND NOW()
          AND (pd.metodo_pago = 'contra_entrega' OR pd.metodo_pago IS NULL)
      ), 0) AS total_online_efectivo,
      IFNULL((
        SELECT COUNT(*)
        FROM pedidos_digitales pd
        WHERE pd.status = 'Confirmado'
          AND pd.confirmado_por = t.usuario_id
          AND pd.negocio_id = u.negocios_id
          AND pd.confirmado_en BETWEEN t.inicio AND NOW()
      ), 0) AS num_ventas_online
      ,IFNULL((
        SELECT SUM(m.monto)
        FROM movimientos_caja m
        WHERE m.negocio_id = u.negocios_id
          AND m.turno_id = t.id
          AND m.tipo = 'ingreso'
      ), 0) AS total_ingresos_caja
      ,IFNULL((
        SELECT SUM(m.monto)
        FROM movimientos_caja m
        WHERE m.negocio_id = u.negocios_id
          AND m.turno_id = t.id
          AND m.tipo = 'egreso'
      ), 0) AS total_egresos_caja,
      n.nombre AS nombre_negocio,
      u.nombre AS nombre_empleado
    FROM turnos t
    JOIN usuarios u ON t.usuario_id = u.id
    LEFT JOIN negocios n ON n.id = u.negocios_id
    WHERE t.id = ?
    LIMIT 1
  `;

  db.query(sqlResumen, [id], (errResumen, rowsResumen) => {
    if (errResumen) return res.status(500).json({ message: "Error al calcular resumen de turno", errResumen });
    if (!rowsResumen.length) return res.status(404).json({ message: "Turno no encontrado" });

    const resumen = rowsResumen[0];
    const totalEfectivo = Number(resumen.total_local || 0) + Number(resumen.total_online_efectivo || 0);
    const totalTransferencia = Number(resumen.total_transferencia || 0);
    const totalVentas = totalEfectivo + totalTransferencia;
    const totalIngresosCaja = Number(resumen.total_ingresos_caja || 0);
    const totalEgresosCaja = Number(resumen.total_egresos_caja || 0);
    const montoEsperadoCaja = parseFloat(resumen.monto_inicial || 0) + totalEfectivo + totalIngresosCaja - totalEgresosCaja;
    const montoDeclarado = monto_final_declarado != null ? parseFloat(monto_final_declarado) : null;

    const sqlCerrar = `UPDATE turnos SET 
      fin = CURRENT_TIMESTAMP, 
      total_ventas = ?, 
      total_efectivo = ?, 
      total_transferencia = ?,
      monto_final_declarado = ?
      WHERE id = ?`;
    db.query(sqlCerrar, [totalVentas, totalEfectivo, totalTransferencia, montoDeclarado, id], (errCerrar) => {
      if (errCerrar) return res.status(500).json({ message: "Error al cerrar turno", errCerrar });

      // Enviar reporte completo de cierre de caja a Telegram
      TelegramService.sendShiftClosingReport(resumen.negocios_id, {
        negocioNombre: resumen.nombre_negocio || 'Sucursal desconocida',
        empleadoNombre: resumen.nombre_empleado || 'Empleado desconocido',
        totalVentas: totalVentas,
        totalEfectivo: totalEfectivo,
        totalTransferencia: totalTransferencia,
        totalGastos: totalEgresosCaja,
        montoEsperado: montoEsperadoCaja,
        montoDeclarado: montoDeclarado || 0,
        diferencia: montoDeclarado != null ? montoDeclarado - montoEsperadoCaja : 0
      }).catch(err => console.error("Error enviando reporte de cierre a Telegram:", err));

      res.json({
        message: "Turno cerrado correctamente",
        total_ventas: totalVentas,
        total_efectivo: totalEfectivo,
        total_transferencia: totalTransferencia,
        total_ingresos_caja: totalIngresosCaja,
        total_egresos_caja: totalEgresosCaja,
        monto_esperado_caja: montoEsperadoCaja,
        diferencia_caja: montoDeclarado != null ? montoDeclarado - montoEsperadoCaja : null
      });
    });
  });
};

export const extenderTurno = (req, res) => {
  const { id, minutos } = req.body;
  const extra = Number(minutos || 10);

  if (!id || Number.isNaN(extra) || extra <= 0) {
    return res.status(400).json({ message: "Datos invalidos para extender turno" });
  }

  const sql = `
    UPDATE turnos
    SET
      minutos_extra_autorizados = IFNULL(minutos_extra_autorizados, 0) + ?,
      num_extensiones = IFNULL(num_extensiones, 0) + 1
    WHERE id = ? AND fin IS NULL
  `;

  db.query(sql, [extra, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error al extender turno", err });
    if (!result.affectedRows) return res.status(404).json({ message: "Turno no encontrado o ya cerrado" });

    db.query(
      "SELECT id, minutos_extra_autorizados, num_extensiones FROM turnos WHERE id = ? LIMIT 1",
      [id],
      (errSel, rows) => {
        if (errSel) return res.status(500).json({ message: "Error al consultar extension", errSel });
        const row = rows?.[0] || {};
        return res.json({
          message: `Turno extendido ${extra} minutos`,
          id: row.id,
          minutos_extra_autorizados: Number(row.minutos_extra_autorizados || 0),
          num_extensiones: Number(row.num_extensiones || 0)
        });
      }
    );
  });
};

export const obtenerTurnosActivos = (req, res) => {
  const sql = `
    SELECT
      t.*,
      u.nombre AS nombre_usuario,
      u.horario_salida,
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

export const obtenerRendimientoHorasExtra = (_req, res) => {
  const sql = `
    SELECT
      u.id AS usuario_id,
      u.nombre AS nombre_usuario,
      u.role,
      COUNT(t.id) AS turnos_registrados,
      SUM(CASE WHEN IFNULL(t.minutos_extra_autorizados, 0) > 0 THEN 1 ELSE 0 END) AS turnos_con_extra,
      SUM(IFNULL(t.minutos_extra_autorizados, 0)) AS minutos_extra_total,
      SUM(IFNULL(t.num_extensiones, 0)) AS total_extensiones,
      SUM(IFNULL(t.total_ventas, 0)) AS ventas_totales,
      AVG(IFNULL(t.total_ventas, 0)) AS venta_promedio_turno
    FROM turnos t
    JOIN usuarios u ON u.id = t.usuario_id
    WHERE t.fin IS NOT NULL
      AND (u.role = 'Empleado' OR u.role = 'empleado')
    GROUP BY u.id, u.nombre, u.role
    ORDER BY minutos_extra_total DESC, total_extensiones DESC, turnos_con_extra DESC
    LIMIT 20
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al obtener rendimiento de horas extra", err });
    return res.json(Array.isArray(rows) ? rows : []);
  });
};

export const obtenerCortesDia = (req, res) => {
  const { negocio_id } = req.params;

  const sql = `
    SELECT
      t.id,
      t.inicio,
      t.fin,
      t.monto_inicial,
      t.monto_final_declarado,
      t.monto_real_admin,
      t.ajuste_admin_nota,
      t.ajuste_admin_usuario_id,
      t.ajuste_admin_at,
      u.id AS usuario_id,
      u.nombre AS nombre_usuario,
      ua.nombre AS nombre_admin_ajuste,
      IFNULL(t.total_efectivo, 0) AS total_efectivo,
      IFNULL((
        SELECT SUM(m.monto)
        FROM movimientos_caja m
        WHERE m.negocio_id = u.negocios_id
          AND m.turno_id = t.id
          AND m.tipo = 'ingreso'
      ), 0) AS total_ingresos_caja,
      IFNULL((
        SELECT SUM(m.monto)
        FROM movimientos_caja m
        WHERE m.negocio_id = u.negocios_id
          AND m.turno_id = t.id
          AND m.tipo = 'egreso'
      ), 0) AS total_egresos_caja
    FROM turnos t
    JOIN usuarios u ON u.id = t.usuario_id
    LEFT JOIN usuarios ua ON ua.id = t.ajuste_admin_usuario_id
    WHERE u.negocios_id = ?
      AND t.fin IS NOT NULL
      AND DATE(t.fin) = CURDATE()
    ORDER BY t.fin DESC
  `;

  db.query(sql, [negocio_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al obtener cortes del dia", err });

    const items = (rows || []).map((r) => {
      const montoEsperado = Number(r.monto_inicial || 0)
        + Number(r.total_efectivo || 0)
        + Number(r.total_ingresos_caja || 0)
        - Number(r.total_egresos_caja || 0);
      const montoDeclarado = r.monto_final_declarado != null ? Number(r.monto_final_declarado) : null;
      const montoRealAdmin = r.monto_real_admin != null ? Number(r.monto_real_admin) : null;
      const diferenciaEmpleado = montoDeclarado != null ? montoDeclarado - montoEsperado : null;
      const diferenciaFinal = (montoRealAdmin != null ? montoRealAdmin : montoDeclarado) != null
        ? (montoRealAdmin != null ? montoRealAdmin : montoDeclarado) - montoEsperado
        : null;

      return {
        ...r,
        monto_esperado_caja: montoEsperado,
        diferencia_caja: diferenciaEmpleado,
        diferencia_caja_final: diferenciaFinal,
      };
    });

    const resumen = items.reduce((acc, it) => {
      acc.total_esperado += Number(it.monto_esperado_caja || 0);
      acc.total_declarado += Number(it.monto_final_declarado || 0);
      acc.total_real_admin += Number((it.monto_real_admin != null ? it.monto_real_admin : it.monto_final_declarado) || 0);
      acc.total_diferencia += Number(it.diferencia_caja || 0);
      acc.total_diferencia_final += Number(it.diferencia_caja_final || 0);
      acc.num_cortes += 1;
      return acc;
    }, { total_esperado: 0, total_declarado: 0, total_real_admin: 0, total_diferencia: 0, total_diferencia_final: 0, num_cortes: 0 });

    return res.json({ resumen, cortes: items });
  });
};

export const guardarAjusteCorte = (req, res) => {
  const { turno_id, monto_real_admin, nota, admin_usuario_id } = req.body;

  if (!turno_id || monto_real_admin == null || Number.isNaN(Number(monto_real_admin))) {
    return res.status(400).json({ message: "Datos invalidos para ajuste de corte" });
  }

  const sql = `
    UPDATE turnos
    SET
      monto_real_admin = ?,
      ajuste_admin_nota = ?,
      ajuste_admin_usuario_id = ?,
      ajuste_admin_at = NOW()
    WHERE id = ?
      AND fin IS NOT NULL
  `;

  db.query(sql, [Number(monto_real_admin), nota || null, admin_usuario_id || null, turno_id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error al guardar ajuste de corte", err });
    if (!result.affectedRows) return res.status(404).json({ message: "Corte no encontrado o aun no cerrado" });
    return res.json({ message: "Ajuste guardado" });
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
      t.total_efectivo,
      t.total_transferencia,
      t.monto_final_declarado,
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
      ,IFNULL((
        SELECT SUM(pd.total)
        FROM pedidos_digitales pd
        WHERE pd.status = 'Confirmado'
          AND pd.confirmado_por = t.usuario_id
          AND pd.negocio_id = u.negocios_id
          AND pd.confirmado_en BETWEEN t.inicio AND IFNULL(t.fin, NOW())
          AND pd.metodo_pago = 'transferencia'
      ), 0) AS total_transferencia_online
      ,IFNULL((
        SELECT SUM(pd.total)
        FROM pedidos_digitales pd
        WHERE pd.status = 'Confirmado'
          AND pd.confirmado_por = t.usuario_id
          AND pd.negocio_id = u.negocios_id
          AND pd.confirmado_en BETWEEN t.inicio AND IFNULL(t.fin, NOW())
          AND (pd.metodo_pago = 'contra_entrega' OR pd.metodo_pago IS NULL)
      ), 0) AS total_online_efectivo
      ,IFNULL((
        SELECT SUM(m.monto)
        FROM movimientos_caja m
        WHERE m.negocio_id = u.negocios_id
          AND m.turno_id = t.id
          AND m.tipo = 'ingreso'
      ), 0) AS total_ingresos_caja
      ,IFNULL((
        SELECT SUM(m.monto)
        FROM movimientos_caja m
        WHERE m.negocio_id = u.negocios_id
          AND m.turno_id = t.id
          AND m.tipo = 'egreso'
      ), 0) AS total_egresos_caja
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
    const totalOnlineEfectivo = Number(row.total_online_efectivo || 0);
    const totalTransferencia = Number(row.total_transferencia || row.total_transferencia_online || 0);
    const totalEfectivo = Number(row.total_efectivo || 0) || (totalLocal + totalOnlineEfectivo);
    const totalIngresosCaja = Number(row.total_ingresos_caja || 0);
    const totalEgresosCaja = Number(row.total_egresos_caja || 0);
    const numLocal = Number(row.num_ventas_local || 0);
    const numOnline = Number(row.num_ventas_online || 0);
    const totalVentas = totalEfectivo + totalTransferencia;
    const montoEsperadoCaja = Number(row.monto_inicial || 0) + totalEfectivo + totalIngresosCaja - totalEgresosCaja;
    const montoFinalDeclarado = row.monto_final_declarado != null ? Number(row.monto_final_declarado) : null;

    res.json({
      ...row,
      num_ventas: numLocal + numOnline,
      total_ventas: totalVentas,
      total_online: totalOnline,
      total_efectivo: totalEfectivo,
      total_transferencia: totalTransferencia,
      total_ingresos_caja: totalIngresosCaja,
      total_egresos_caja: totalEgresosCaja,
      monto_esperado_caja: montoEsperadoCaja,
      diferencia_caja: montoFinalDeclarado != null ? montoFinalDeclarado - montoEsperadoCaja : null,
      total_caja_final: montoEsperadoCaja
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

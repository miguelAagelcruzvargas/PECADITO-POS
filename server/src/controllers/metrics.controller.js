import db from '../db.js';

export const getGlobalMetrics = (req, res) => {
  const sql = `
    SELECT 
      n.id, 
      n.nombre, 
      (SELECT COUNT(*) FROM pedidos_digitales WHERE negocio_id = n.id AND status = 'Pendiente') as pedidos_pendientes,
      (SELECT IFNULL(SUM(total), 0) FROM ventas WHERE id_negocio = n.id AND DATE(created_at) = CURDATE()) as ventas_hoy,
      (SELECT COUNT(*) FROM inventario WHERE negocio_id = n.id AND stock <= 10) as stock_bajo
    FROM negocios n
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

export const getGlobalDetailedMetrics = (req, res) => {
  const sqlNegocios = `
    SELECT
      n.id,
      n.nombre,
      n.ubicacion,
      n.tipo,
      (
        SELECT IFNULL(SUM(v.total), 0)
        FROM ventas v
        WHERE v.id_negocio = n.id
          AND DATE(v.created_at) = CURDATE()
      ) AS ventas_hoy_local,
      (
        SELECT COUNT(*)
        FROM ventas v
        WHERE v.id_negocio = n.id
          AND DATE(v.created_at) = CURDATE()
      ) AS tickets_hoy_local,
      (
        SELECT IFNULL(SUM(pd.total), 0)
        FROM pedidos_digitales pd
        WHERE pd.negocio_id = n.id
          AND pd.status = 'Confirmado'
          AND DATE(COALESCE(pd.confirmado_en, pd.created_at)) = CURDATE()
      ) AS ventas_hoy_online,
      (
        SELECT COUNT(*)
        FROM pedidos_digitales pd
        WHERE pd.negocio_id = n.id
          AND pd.status = 'Confirmado'
          AND DATE(COALESCE(pd.confirmado_en, pd.created_at)) = CURDATE()
      ) AS pedidos_confirmados_hoy,
      (
        SELECT COUNT(*)
        FROM pedidos_digitales pd
        WHERE pd.negocio_id = n.id
          AND (
            pd.status = 'Pendiente'
            OR pd.status = 'En preparacion'
            OR pd.status = 'En preparación'
          )
      ) AS pedidos_activos,
      (
        SELECT COUNT(*)
        FROM inventario i
        WHERE i.negocio_id = n.id
          AND i.activo = 1
          AND i.stock <= 10
      ) AS stock_bajo
    FROM negocios n
    ORDER BY n.nombre ASC
  `;

  const sqlTurnosActivos = `
    SELECT
      t.id,
      t.usuario_id,
      t.inicio,
      t.monto_inicial,
      u.negocios_id,
      u.nombre AS nombre_usuario,
      u.role AS role_usuario
    FROM turnos t
    JOIN usuarios u ON u.id = t.usuario_id
    WHERE t.fin IS NULL
    ORDER BY t.inicio ASC
  `;

  db.query(sqlNegocios, (errNeg, negocios) => {
    if (errNeg) return res.status(500).json(errNeg);

    db.query(sqlTurnosActivos, (errTurnos, turnos) => {
      if (errTurnos) return res.status(500).json(errTurnos);

      const mapTurnosByNegocio = new Map();
      (turnos || []).forEach((t) => {
        const key = Number(t.negocios_id);
        if (!mapTurnosByNegocio.has(key)) {
          mapTurnosByNegocio.set(key, []);
        }
        mapTurnosByNegocio.get(key).push({
          id: t.id,
          usuario_id: t.usuario_id,
          nombre_usuario: t.nombre_usuario,
          role_usuario: t.role_usuario,
          inicio: t.inicio,
          monto_inicial: Number(t.monto_inicial || 0),
        });
      });

      const detailed = (negocios || []).map((n) => {
        const ventasLocal = Number(n.ventas_hoy_local || 0);
        const ventasOnline = Number(n.ventas_hoy_online || 0);
        const ventasTotales = ventasLocal + ventasOnline;

        return {
          id: n.id,
          nombre: n.nombre,
          ubicacion: n.ubicacion,
          tipo: n.tipo,
          ventas_hoy_local: ventasLocal,
          ventas_hoy_online: ventasOnline,
          ventas_hoy_total: Number(ventasTotales.toFixed(2)),
          tickets_hoy_local: Number(n.tickets_hoy_local || 0),
          pedidos_confirmados_hoy: Number(n.pedidos_confirmados_hoy || 0),
          pedidos_activos: Number(n.pedidos_activos || 0),
          stock_bajo: Number(n.stock_bajo || 0),
          turnos_activos: mapTurnosByNegocio.get(Number(n.id)) || [],
        };
      });

      const resumen = {
        total_sucursales: detailed.length,
        ventas_hoy_total: Number(detailed.reduce((acc, n) => acc + Number(n.ventas_hoy_total || 0), 0).toFixed(2)),
        pedidos_activos_total: detailed.reduce((acc, n) => acc + Number(n.pedidos_activos || 0), 0),
        stock_bajo_total: detailed.reduce((acc, n) => acc + Number(n.stock_bajo || 0), 0),
        sucursales_con_turno: detailed.filter((n) => (n.turnos_activos || []).length > 0).length,
      };

      return res.json({ resumen, sucursales: detailed });
    });
  });
};

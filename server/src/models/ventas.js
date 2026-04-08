import db from '../db.js'; // ya no ejecutes connectDB()

// Crear puntos de venta
export const createVenta = (data, callback) => {
  const sql = `
    INSERT INTO ventas (total, id_cliente, metodo_pago, id_negocio, usuario_id, usuario_nombre, turno_id, canal_venta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    data.total,
    data.id_cliente,
    data.metodo_pago,
    data.id_negocio,
    data.usuario_id || null,
    data.usuario_nombre || 'Admin',
    data.turno_id || null,
    data.canal_venta || 'Local'
  ];
  db.query(sql, values, callback);
};

// Obtener valores por id
export const getValoresById = (id, callback) => {
  const sql = `
    (
      SELECT 
        CONCAT('L-', v.id) AS uid,
        v.id,
        'venta_local' AS tipo_registro,
        v.total,
        COALESCE(c.nombre, 'Cliente mostrador') COLLATE utf8mb4_unicode_ci AS nombre_cliente,
        CASE
          WHEN LOWER(COALESCE(v.metodo_pago, '')) LIKE '%transfer%' THEN 'Transferencia'
          WHEN LOWER(COALESCE(v.metodo_pago, '')) LIKE '%contra%' THEN 'Contra entrega'
          ELSE 'Efectivo'
        END COLLATE utf8mb4_unicode_ci AS metodo_pago,
        v.created_at,
        v.id_negocio,
        COALESCE(v.canal_venta, 'Local') COLLATE utf8mb4_unicode_ci AS canal_venta,
        COALESCE(u1.nombre, v.usuario_nombre, 'Admin') COLLATE utf8mb4_unicode_ci AS nombre_usuario,
        COALESCE(u1.role, 'Administrador') COLLATE utf8mb4_unicode_ci AS role_usuario,
        'Venta fisica en caja' COLLATE utf8mb4_unicode_ci AS empleado_accion
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id
      LEFT JOIN usuarios u1 ON v.usuario_id = u1.id
      WHERE v.id_negocio = ?
    )
    UNION ALL
    (
      SELECT
        CONCAT('D-', pd.id) AS uid,
        pd.id,
        'pedido_online' AS tipo_registro,
        pd.total,
        pd.cliente_nombre COLLATE utf8mb4_unicode_ci AS nombre_cliente,
        CASE
          WHEN LOWER(COALESCE(pd.metodo_pago, '')) LIKE '%transfer%' THEN 'Transferencia'
          WHEN LOWER(COALESCE(pd.metodo_pago, '')) LIKE '%contra%' THEN 'Contra entrega'
          WHEN COALESCE(pd.metodo_pago, '') = '' THEN 'Contra entrega'
          ELSE 'Efectivo'
        END COLLATE utf8mb4_unicode_ci AS metodo_pago,
        COALESCE(pd.confirmado_en, pd.created_at) AS created_at,
        pd.negocio_id AS id_negocio,
        'Online' COLLATE utf8mb4_unicode_ci AS canal_venta,
        COALESCE(u2.nombre, 'Sin confirmar') COLLATE utf8mb4_unicode_ci AS nombre_usuario,
        COALESCE(u2.role, 'N/A') COLLATE utf8mb4_unicode_ci AS role_usuario,
        CASE
          WHEN u2.id IS NULL THEN 'Pedido online pendiente de confirmar empleado'
          ELSE 'Pedido online confirmado por empleado'
        END COLLATE utf8mb4_unicode_ci AS empleado_accion
      FROM pedidos_digitales pd
      LEFT JOIN usuarios u2 ON pd.confirmado_por = u2.id
      WHERE pd.negocio_id = ?
        AND pd.status = 'Confirmado'
    )
    ORDER BY created_at DESC
  `;
  db.query(sql, [id, id], callback);
};

// Crear detalles ventas
export const createDetallesVenta = (data, callback) => {
  const sql = `
      INSERT INTO detalle_venta 
      (venta_id, producto_id, cantidad, subtotal, id_negocio) 
      VALUES (?, ?, ?, ?, ?)
  `;
  const values = [
      data.venta_id,
      data.producto_id,
      data.cantidad,
      data.subtotal,
      data.id_negocio
  ];

  db.query(sql, values, callback);
};

export const getTopProductosMes = (id_negocio, callback) => {
    const sql = `
        SELECT 
            i.producto AS nombre_producto,
            SUM(dv.cantidad) AS total_vendido
        FROM detalle_venta dv
        JOIN inventario i ON dv.producto_id = i.id
        WHERE dv.id_negocio = ?
          AND MONTH(dv.created_at) = MONTH(CURDATE())
          AND YEAR(dv.created_at) = YEAR(CURDATE())
        GROUP BY i.producto
        ORDER BY total_vendido DESC
        LIMIT 5;
    `;
    db.query(sql, [id_negocio], callback);
};

// Obtener el total de ventas por mes (llenando los meses vacíos con 0)
export const getVentasPorMes = (id_negocio, callback) => {
    const sql = `
        SELECT 
            m.mes,
            COALESCE(SUM(v.total), 0) AS total_ventas,
            MAX(v.created_at) AS fecha
        FROM (
            SELECT 1 AS num_mes, 'Enero' AS mes
            UNION SELECT 2, 'Febrero'
            UNION SELECT 3, 'Marzo'
            UNION SELECT 4, 'Abril'
            UNION SELECT 5, 'Mayo'
            UNION SELECT 6, 'Junio'
            UNION SELECT 7, 'Julio'
            UNION SELECT 8, 'Agosto'
            UNION SELECT 9, 'Septiembre'
            UNION SELECT 10, 'Octubre'
            UNION SELECT 11, 'Noviembre'
            UNION SELECT 12, 'Diciembre'
        ) AS m
        LEFT JOIN ventas v 
            ON MONTH(v.created_at) = m.num_mes
            AND YEAR(v.created_at) = YEAR(CURDATE())
            AND v.id_negocio = ?
        GROUP BY m.num_mes, m.mes
        ORDER BY m.num_mes;
    `;

    db.query(sql, [id_negocio], callback);
};

export const getTotalGeneralVentas = (id_negocio, callback) => {
    const sql = `
        SELECT IFNULL(SUM(total), 0) AS total_general
        FROM ventas
        WHERE id_negocio = ?;
    `;
    db.query(sql, [id_negocio], callback);
};

export const obtenerCantidadProductosVendidos = (id_negocio, callback) => {
  const sql = `
    SELECT
      i.producto AS nombre_producto,
      SUM(dv.cantidad) AS total_cantidad,
      MAX(dv.created_at) AS created_at
    FROM detalle_venta dv
    JOIN inventario i ON dv.producto_id = i.id
    WHERE dv.id_negocio = ?
    GROUP BY i.producto;
  `;

  db.query(sql, [id_negocio], (err, results) => {
    if (err) {
      console.error('Error al consultar productos vendidos:', err);
      return callback(err, null);
    }
    callback(null, results);
  });
};

export const obtenerResumenMensual = (idNegocio, callback) => {
  const setLocaleQuery = "SET lc_time_names = 'es_MX';";

  const resumenQuery = `
      WITH meses AS (
      SELECT '2025-01' AS mes UNION ALL
      SELECT '2025-02' UNION ALL
      SELECT '2025-03' UNION ALL
      SELECT '2025-04' UNION ALL
      SELECT '2025-05' UNION ALL
      SELECT '2025-06' UNION ALL
      SELECT '2025-07' UNION ALL
      SELECT '2025-08' UNION ALL
      SELECT '2025-09' UNION ALL
      SELECT '2025-10' UNION ALL
      SELECT '2025-11' UNION ALL
      SELECT '2025-12'
    )
    SELECT 
      DATE_FORMAT(CONCAT(m.mes, '-01'), '%M') AS mes,
      COALESCE(g.total_gastos, 0) AS total_gastos,
      COALESCE(v.total_ventas, 0) AS total_ventas,
      (COALESCE(v.total_ventas, 0) - COALESCE(g.total_gastos, 0)) AS ganancia
    FROM meses m
    LEFT JOIN (
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS mes,
        SUM(costo) AS total_gastos
      FROM gastos
      WHERE id_negocio = ?
      GROUP BY mes
    ) g ON m.mes = g.mes
    LEFT JOIN (
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS mes,
        SUM(total) AS total_ventas
      FROM ventas
      WHERE id_negocio = ?
      GROUP BY mes
    ) v ON m.mes = v.mes
    ORDER BY m.mes;
  `;

  // Ejecutamos primero el SET y luego el SELECT
  db.query(setLocaleQuery, (err) => {
    if (err) {
      callback(err, null);
    } else {
      db.query(resumenQuery, [idNegocio, idNegocio], (err, results) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, results);
        }
      });
    }
  });
};

export const obtenerReporteAvanzado = (idNegocio, desde, hasta, callback) => {
  const whereFechas = [];
  const paramsTx = [idNegocio, idNegocio];
  const paramsGastos = [idNegocio];
  const paramsProductos = [idNegocio];

  if (desde) {
    whereFechas.push('t.fecha >= ?');
    paramsTx.push(`${desde} 00:00:00`);
    paramsGastos.push(`${desde} 00:00:00`);
    paramsProductos.push(`${desde} 00:00:00`);
  }
  if (hasta) {
    whereFechas.push('t.fecha <= ?');
    paramsTx.push(`${hasta} 23:59:59`);
    paramsGastos.push(`${hasta} 23:59:59`);
    paramsProductos.push(`${hasta} 23:59:59`);
  }

  const whereTxSql = whereFechas.length ? `WHERE ${whereFechas.join(' AND ')}` : '';

  const sqlTransacciones = `
    SELECT *
    FROM (
      SELECT
        v.created_at AS fecha,
        v.total,
        COALESCE(v.usuario_nombre, 'Admin') AS nombre_usuario,
        COALESCE(v.canal_venta, 'Local') AS canal_venta
      FROM ventas v
      WHERE v.id_negocio = ?

      UNION ALL

      SELECT
        COALESCE(pd.confirmado_en, pd.created_at) AS fecha,
        pd.total,
        CASE
          WHEN LOWER(COALESCE(u.role, '')) LIKE '%admin%' THEN 'Admin'
          ELSE COALESCE(u.nombre, 'Admin')
        END AS nombre_usuario,
        'Online' AS canal_venta
      FROM pedidos_digitales pd
      LEFT JOIN usuarios u ON pd.confirmado_por = u.id
      WHERE pd.negocio_id = ?
        AND pd.status = 'Confirmado'
    ) t
    ${whereTxSql}
    ORDER BY t.fecha ASC
  `;

  const sqlGastos = `
    SELECT IFNULL(SUM(costo), 0) AS total_gastos
    FROM gastos
    WHERE id_negocio = ?
    ${desde ? 'AND created_at >= ?' : ''}
    ${hasta ? 'AND created_at <= ?' : ''}
  `;

  const sqlProductos = `
    SELECT
      t.nombre_producto,
      SUM(t.total_cantidad) AS total_cantidad,
      SUM(t.total_ventas) AS total_ventas
    FROM (
      SELECT
        i.producto AS nombre_producto,
        SUM(dv.cantidad) AS total_cantidad,
        SUM(dv.subtotal) AS total_ventas
      FROM detalle_venta dv
      JOIN inventario i ON i.id = dv.producto_id
      JOIN ventas v ON v.id = dv.venta_id
      WHERE dv.id_negocio = ?
      ${desde ? 'AND v.created_at >= ?' : ''}
      ${hasta ? 'AND v.created_at <= ?' : ''}
      GROUP BY i.producto

      UNION ALL

      SELECT
        COALESCE(i2.producto, CONCAT('Producto #', d2.producto_id)) AS nombre_producto,
        SUM(d2.cantidad) AS total_cantidad,
        SUM(d2.subtotal) AS total_ventas
      FROM detalle_pedido_digital d2
      JOIN pedidos_digitales pd2 ON pd2.id = d2.pedido_id
      LEFT JOIN inventario i2 ON i2.id = d2.producto_id
      WHERE pd2.negocio_id = ?
        AND pd2.status = 'Confirmado'
      ${desde ? 'AND COALESCE(pd2.confirmado_en, pd2.created_at) >= ?' : ''}
      ${hasta ? 'AND COALESCE(pd2.confirmado_en, pd2.created_at) <= ?' : ''}
      GROUP BY COALESCE(i2.producto, CONCAT('Producto #', d2.producto_id))
    ) t
    GROUP BY t.nombre_producto
    ORDER BY total_cantidad DESC
  `;

  const paramsProductosCompleto = [...paramsProductos, idNegocio];
  if (desde) paramsProductosCompleto.push(`${desde} 00:00:00`);
  if (hasta) paramsProductosCompleto.push(`${hasta} 23:59:59`);

  db.query(sqlTransacciones, paramsTx, (errTx, transacciones) => {
    if (errTx) return callback(errTx);

    db.query(sqlGastos, paramsGastos, (errGastos, gastosRows) => {
      if (errGastos) return callback(errGastos);

      db.query(sqlProductos, paramsProductosCompleto, (errProductos, productosRows) => {
        if (errProductos) return callback(errProductos);

        const porDiaMap = new Map();
        const porSemanaMap = new Map();
        const porMesMap = new Map();
        const porEmpleadoMap = new Map();
        const porCanalMap = new Map();

        const getWeekLabel = (date) => {
          const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
          return `${d.getUTCFullYear()}-S${String(weekNo).padStart(2, '0')}`;
        };

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        let totalVentas = 0;
        let numVentas = 0;

        (transacciones || []).forEach((row) => {
          const fecha = new Date(row.fecha);
          if (Number.isNaN(fecha.getTime())) return;

          const total = Number(row.total || 0);
          const diaKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
          const semanaKey = getWeekLabel(fecha);
          const mesKey = `${monthNames[fecha.getMonth()]} ${fecha.getFullYear()}`;
          const empleadoKey = row.nombre_usuario || 'Sin asignar';
          const canalKey = row.canal_venta || 'Local';

          totalVentas += total;
          numVentas += 1;

          const diaPrev = porDiaMap.get(diaKey) || { dia: diaKey, total_ventas: 0, num_ventas: 0 };
          diaPrev.total_ventas += total;
          diaPrev.num_ventas += 1;
          porDiaMap.set(diaKey, diaPrev);

          const semanaPrev = porSemanaMap.get(semanaKey) || { semana: semanaKey, total_ventas: 0, num_ventas: 0 };
          semanaPrev.total_ventas += total;
          semanaPrev.num_ventas += 1;
          porSemanaMap.set(semanaKey, semanaPrev);

          const mesPrev = porMesMap.get(mesKey) || { mes: mesKey, total_ventas: 0, num_ventas: 0 };
          mesPrev.total_ventas += total;
          mesPrev.num_ventas += 1;
          porMesMap.set(mesKey, mesPrev);

          const empPrev = porEmpleadoMap.get(empleadoKey) || { nombre_usuario: empleadoKey, total_ventas: 0, num_ventas: 0 };
          empPrev.total_ventas += total;
          empPrev.num_ventas += 1;
          porEmpleadoMap.set(empleadoKey, empPrev);

          const canalPrev = porCanalMap.get(canalKey) || { canal_venta: canalKey, total_ventas: 0, num_ventas: 0 };
          canalPrev.total_ventas += total;
          canalPrev.num_ventas += 1;
          porCanalMap.set(canalKey, canalPrev);
        });

        const totalGastos = Number(gastosRows?.[0]?.total_gastos || 0);
        const ticketPromedio = numVentas ? (totalVentas / numVentas) : 0;

        return callback(null, {
          kpis: {
            total_ventas: Number(totalVentas.toFixed(2)),
            num_ventas: numVentas,
            ticket_promedio: Number(ticketPromedio.toFixed(2)),
            total_gastos: Number(totalGastos.toFixed(2)),
            ganancia: Number((totalVentas - totalGastos).toFixed(2))
          },
          por_dia: Array.from(porDiaMap.values()),
          por_semana: Array.from(porSemanaMap.values()),
          por_mes: Array.from(porMesMap.values()),
          por_empleado: Array.from(porEmpleadoMap.values()).sort((a, b) => b.total_ventas - a.total_ventas),
          por_canal: Array.from(porCanalMap.values()).sort((a, b) => b.total_ventas - a.total_ventas),
          por_producto: (productosRows || []).map((p) => ({
            nombre_producto: p.nombre_producto,
            total_cantidad: Number(p.total_cantidad || 0),
            total_ventas: Number(p.total_ventas || 0)
          }))
        });
      });
    });
  });
};

// ---- Eliminación de venta con reversión de stock ----

// Obtener detalles de una venta específica
export const getDetallesByVenta = (ventaId, callback) => {
  const sql = `SELECT producto_id, cantidad FROM detalle_venta WHERE venta_id = ?`;
  db.query(sql, [ventaId], callback);
};

// Sumar stock de un producto
export const sumarStockProducto = (productoId, cantidad, callback) => {
  const sql = `UPDATE inventario SET stock = stock + ? WHERE id = ?`;
  db.query(sql, [cantidad, productoId], callback);
};

// Eliminar detalles de venta
export const deleteDetallesVenta = (ventaId, callback) => {
  const sql = `DELETE FROM detalle_venta WHERE venta_id = ?`;
  db.query(sql, [ventaId], callback);
};

// Eliminar venta
export const deleteVenta = (ventaId, callback) => {
  const sql = `DELETE FROM ventas WHERE id = ?`;
  db.query(sql, [ventaId], callback);
};

// ---- Utilidades de stock para creación de detalles ----
export const getStockForUpdate = (productoId, callback) => {
  const sql = 'SELECT stock, precio FROM inventario WHERE id = ? FOR UPDATE';
  db.query(sql, [productoId], (err, rows) => {
    if (err) return callback(err);
    if (!rows.length) return callback(null, null); // producto inexistente
    callback(null, { stock: rows[0].stock, precio: rows[0].precio });
  });
};

export const descontarStockProducto = (productoId, cantidad, callback) => {
  const sql = 'UPDATE inventario SET stock = stock - ? WHERE id = ?';
  db.query(sql, [cantidad, productoId], callback);
};

export const recomputeVentaTotalFromDetalles = (ventaId, callback) => {
  const sql = `UPDATE ventas v
    SET total = (
      SELECT IFNULL(SUM(dv.subtotal),0)
      FROM detalle_venta dv
      WHERE dv.venta_id = v.id
    )
    WHERE v.id = ?`;
  db.query(sql, [ventaId], callback);
};
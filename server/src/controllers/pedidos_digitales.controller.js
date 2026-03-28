import db from '../db.js';

export const createPedidoDigital = (data, callback) => {
  const sql = `
    INSERT INTO pedidos_digitales (
      cliente_nombre,
      total,
      negocio_id,
      canal_origen,
      contacto_cliente,
      notas_cliente,
      tipo_entrega,
      entrega_detalle,
      entrega_lat,
      entrega_lng
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const tipoEntrega = data?.tipo_entrega === 'Envio' ? 'Envio' : 'Recoger';
  const canalOrigen = data?.canal_origen?.trim() || 'Menu Digital';
  const values = [
    data.cliente_nombre,
    data.total,
    data.negocio_id,
    canalOrigen,
    data.contacto_cliente || null,
    data.notas_cliente || null,
    tipoEntrega,
    data.entrega_detalle || null,
    data.entrega_lat ?? null,
    data.entrega_lng ?? null
  ];

  db.query(sql, values, (err, result) => {
    if (err) return callback(err);
    const pedidoId = result.insertId;
    const productos = Array.isArray(data.productos) ? data.productos : [];

    if (!productos.length) {
      callback(null, { id: pedidoId });
      return;
    }

    const detalleSql = 'INSERT INTO detalle_pedido_digital (pedido_id, producto_id, cantidad, subtotal) VALUES ?';
    const detalleValues = productos.map((p) => [pedidoId, p.producto_id, p.cantidad, p.subtotal]);
    db.query(detalleSql, [detalleValues], (detalleErr) => {
      callback(detalleErr, { id: pedidoId });
    });
  });
};

export const getPedidosDigitales = (negocioId, optionsOrCallback, maybeCallback) => {
  const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
  const options = typeof optionsOrCallback === 'function' ? {} : (optionsOrCallback || {});
  const view = (options.view || 'active').toString().trim().toLowerCase();

  let statusFilterSql = `
    status IN ('Pendiente', 'En preparación', 'En preparacion')
    OR status = ''
    OR status IS NULL
  `;

  if (view === 'history') {
    statusFilterSql = `
      status IN ('Confirmado', 'Rechazado')
    `;
  } else if (view === 'all') {
    statusFilterSql = `1 = 1`;
  }

  const sqlPedidos = `
    SELECT *
    FROM pedidos_digitales
    WHERE negocio_id = ?
      AND (${statusFilterSql})
    ORDER BY created_at DESC
  `;
  db.query(sqlPedidos, [negocioId], (err, pedidos) => {
    if (err) return callback(err);
    if (!pedidos?.length) return callback(null, []);

    const ids = pedidos.map((p) => p.id);
    const placeholders = ids.map(() => '?').join(',');
    const sqlDetalle = `
      SELECT
        d.pedido_id,
        d.producto_id,
        d.cantidad,
        d.subtotal,
        i.producto,
        i.presentacion
      FROM detalle_pedido_digital d
      LEFT JOIN inventario i ON i.id = d.producto_id
      WHERE d.pedido_id IN (${placeholders})
      ORDER BY d.pedido_id ASC, d.id ASC
    `;

    db.query(sqlDetalle, ids, (errDetalle, detalles) => {
      if (errDetalle) return callback(errDetalle);

      const detallePorPedido = new Map();
      detalles.forEach((row) => {
        if (!detallePorPedido.has(row.pedido_id)) {
          detallePorPedido.set(row.pedido_id, []);
        }
        detallePorPedido.get(row.pedido_id).push({
          producto_id: row.producto_id,
          cantidad: Number(row.cantidad || 0),
          subtotal: Number(row.subtotal || 0),
          producto: row.producto || `Producto #${row.producto_id}`,
          presentacion: row.presentacion || ''
        });
      });

      const enriched = pedidos.map((pedido) => ({
        ...pedido,
        detalles: detallePorPedido.get(pedido.id) || []
      }));

      callback(null, enriched);
    });
  });
};

export const updateStatusPedido = (id, status, callback) => {
  const normalizedStatus = (status || '').trim();
  const statusToStore = normalizedStatus || 'Pendiente';

  if (statusToStore === 'Confirmado') {
    return callback(new Error('Para confirmar se requiere updateStatusPedidoConUsuario'));
  }

  const sql = 'UPDATE pedidos_digitales SET status = ? WHERE id = ?';
  db.query(sql, [statusToStore, id], callback);
};

export const updateStatusPedidoConUsuario = (id, status, usuarioId, callback) => {
  const normalizedStatus = (status || '').trim();
  const statusToStore = normalizedStatus || 'Pendiente';

  if (statusToStore === 'Confirmado') {
    const sql = `
      UPDATE pedidos_digitales
      SET status = ?, confirmado_por = ?, confirmado_en = NOW()
      WHERE id = ?
    `;
    db.query(sql, [statusToStore, usuarioId || null, id], callback);
    return;
  }

  const sql = `
    UPDATE pedidos_digitales
    SET status = ?, confirmado_por = NULL, confirmado_en = NULL
    WHERE id = ?
  `;
  db.query(sql, [statusToStore, id], callback);
};

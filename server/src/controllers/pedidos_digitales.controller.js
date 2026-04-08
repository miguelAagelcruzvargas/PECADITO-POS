import db from '../db.js';

const queryTx = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const applyInsumoConsumption = async ({ negocioId, productoId, cantidad }) => {
  const recetaRows = await queryTx(
    `SELECT r.insumo_id, r.cantidad_por_unidad
     FROM receta_producto_insumo r
     JOIN insumos i ON i.id = r.insumo_id
     WHERE r.producto_id = ?
       AND i.negocio_id = ?
       AND i.activo = 1`,
    [productoId, negocioId]
  );

  if (!recetaRows.length) return;

  const consumoPorInsumo = new Map();
  recetaRows.forEach((r) => {
    const insumoId = Number(r.insumo_id);
    const consumo = (Number(r.cantidad_por_unidad) || 0) * (Number(cantidad) || 0);
    const previo = consumoPorInsumo.get(insumoId) || 0;
    consumoPorInsumo.set(insumoId, previo + consumo);
  });

  const insumoIds = [...consumoPorInsumo.keys()];
  if (!insumoIds.length) return;

  const placeholders = insumoIds.map(() => '?').join(',');
  const stockRows = await queryTx(
    `SELECT id, nombre, stock_actual
     FROM insumos
     WHERE negocio_id = ?
       AND id IN (${placeholders})
     FOR UPDATE`,
    [negocioId, ...insumoIds]
  );

  const stockMap = new Map(stockRows.map((row) => [Number(row.id), row]));

  for (const [insumoId, consumo] of consumoPorInsumo.entries()) {
    const insumo = stockMap.get(insumoId);
    if (!insumo) {
      throw new Error(`Insumo ${insumoId} no encontrado`);
    }
    if (Number(insumo.stock_actual || 0) < consumo) {
      throw new Error(`Stock insuficiente de insumo: ${insumo.nombre}`);
    }
  }

  for (const [insumoId, consumo] of consumoPorInsumo.entries()) {
    await queryTx(
      'UPDATE insumos SET stock_actual = stock_actual - ? WHERE id = ? AND negocio_id = ?',
      [consumo, insumoId, negocioId]
    );
  }
};

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
      metodo_pago,
      entrega_detalle,
      entrega_lat,
      entrega_lng
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const tipoEntrega = data?.tipo_entrega === 'Envio' ? 'Envio' : 'Recoger';
  const canalOrigen = data?.canal_origen?.trim() || 'Menu Digital';
  const metodoPago = data?.metodo_pago === 'transferencia' ? 'transferencia' : 'contra_entrega';
  const values = [
    data.cliente_nombre,
    data.total,
    data.negocio_id,
    canalOrigen,
    data.contacto_cliente || null,
    data.notas_cliente || null,
    tipoEntrega,
    metodoPago,
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
    db.beginTransaction(async (txErr) => {
      if (txErr) return callback(txErr);

      try {
        const pedidoRows = await queryTx(
          `SELECT id, negocio_id, status
           FROM pedidos_digitales
           WHERE id = ?
           FOR UPDATE`,
          [id]
        );

        if (!pedidoRows.length) {
          return db.rollback(() => callback(new Error('Pedido no encontrado')));
        }

        const pedido = pedidoRows[0];

        // Evita descontar stock dos veces si el pedido ya estaba confirmado.
        if (String(pedido.status || '').trim().toLowerCase() !== 'confirmado') {
          const detalleRows = await queryTx(
            `SELECT producto_id, cantidad
             FROM detalle_pedido_digital
             WHERE pedido_id = ?`,
            [id]
          );

          for (const item of detalleRows) {
            const productoId = Number(item.producto_id);
            const cantidad = Number(item.cantidad || 0);

            const stockRows = await queryTx(
              `SELECT id, producto, stock
               FROM inventario
               WHERE id = ?
                 AND negocio_id = ?
                 AND activo = 1
               FOR UPDATE`,
              [productoId, pedido.negocio_id]
            );

            if (!stockRows.length) {
              throw new Error(`Producto ${productoId} no encontrado`);
            }

            const stockActual = Number(stockRows[0].stock || 0);
            if (stockActual < cantidad) {
              throw new Error(`Stock insuficiente de ${stockRows[0].producto}`);
            }

            await queryTx(
              `UPDATE inventario
               SET stock = stock - ?
               WHERE id = ? AND negocio_id = ?`,
              [cantidad, productoId, pedido.negocio_id]
            );

            await applyInsumoConsumption({
              negocioId: Number(pedido.negocio_id),
              productoId,
              cantidad
            });
          }
        }

        const sqlConfirmar = `
          UPDATE pedidos_digitales
          SET status = ?, confirmado_por = ?, confirmado_en = NOW()
          WHERE id = ?
        `;
        await queryTx(sqlConfirmar, [statusToStore, usuarioId || null, id]);

        db.commit((commitErr) => {
          if (commitErr) {
            return db.rollback(() => callback(commitErr));
          }
          callback(null, { ok: true });
        });
      } catch (error) {
        db.rollback(() => callback(error));
      }
    });
    return;
  }

  const sql = `
    UPDATE pedidos_digitales
    SET status = ?, confirmado_por = NULL, confirmado_en = NULL
    WHERE id = ?
  `;
  db.query(sql, [statusToStore, id], callback);
};

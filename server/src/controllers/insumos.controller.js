import db from '../db.js';

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

export const getInsumosByNegocio = async (req, res) => {
  const negocioId = Number(req.params.negocio_id);
  if (!negocioId) return res.status(400).json({ message: 'negocio_id invalido' });

  try {
    const rows = await queryAsync(
      `SELECT id, nombre, unidad, stock_actual, stock_minimo, activo, created_at, updated_at
       FROM insumos
       WHERE negocio_id = ?
       ORDER BY nombre ASC`,
      [negocioId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener insumos', error });
  }
};

export const createInsumo = async (req, res) => {
  const { nombre, unidad = 'pza', stock_actual = 0, stock_minimo = 0, negocio_id } = req.body;
  const negocioId = Number(negocio_id);

  if (!nombre || !negocioId) {
    return res.status(400).json({ message: 'nombre y negocio_id son obligatorios' });
  }

  try {
    const result = await queryAsync(
      `INSERT INTO insumos (nombre, unidad, stock_actual, stock_minimo, negocio_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        String(nombre).trim(),
        ['pza', 'g', 'ml'].includes(unidad) ? unidad : 'pza',
        Number(stock_actual) || 0,
        Number(stock_minimo) || 0,
        negocioId,
      ]
    );

    res.status(201).json({ id: result.insertId, message: 'Insumo creado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear insumo', error });
  }
};

export const updateInsumo = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'id invalido' });

  const {
    nombre,
    unidad,
    stock_actual,
    stock_minimo,
    activo,
  } = req.body;

  try {
    await queryAsync(
      `UPDATE insumos
       SET nombre = COALESCE(?, nombre),
           unidad = COALESCE(?, unidad),
           stock_actual = COALESCE(?, stock_actual),
           stock_minimo = COALESCE(?, stock_minimo),
           activo = COALESCE(?, activo)
       WHERE id = ?`,
      [
        nombre ?? null,
        unidad && ['pza', 'g', 'ml'].includes(unidad) ? unidad : null,
        stock_actual !== undefined ? Number(stock_actual) : null,
        stock_minimo !== undefined ? Number(stock_minimo) : null,
        activo !== undefined ? Number(activo) : null,
        id,
      ]
    );

    res.json({ message: 'Insumo actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar insumo', error });
  }
};

export const getInsumosStockBajo = async (req, res) => {
  const negocioId = Number(req.params.negocio_id);
  if (!negocioId) return res.status(400).json({ message: 'negocio_id invalido' });

  try {
    const rows = await queryAsync(
      `SELECT id, nombre, unidad, stock_actual, stock_minimo
       FROM insumos
       WHERE negocio_id = ?
         AND activo = 1
         AND stock_actual <= stock_minimo
       ORDER BY stock_actual ASC`,
      [negocioId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener alertas de insumos', error });
  }
};

export const upsertRecetaProducto = async (req, res) => {
  const productoId = Number(req.params.producto_id);
  const { receta = [] } = req.body;

  if (!productoId || !Array.isArray(receta)) {
    return res.status(400).json({ message: 'producto_id y receta[] son obligatorios' });
  }

  try {
    await queryAsync('DELETE FROM receta_producto_insumo WHERE producto_id = ?', [productoId]);

    for (const item of receta) {
      const insumoId = Number(item.insumo_id);
      const cantidad = Number(item.cantidad_por_unidad);
      if (!insumoId || !Number.isFinite(cantidad) || cantidad <= 0) continue;

      await queryAsync(
        `INSERT INTO receta_producto_insumo (producto_id, insumo_id, cantidad_por_unidad)
         VALUES (?, ?, ?)`,
        [productoId, insumoId, cantidad]
      );
    }

    res.json({ message: 'Receta de producto guardada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar receta de producto', error });
  }
};

export const getRecetaProducto = async (req, res) => {
  const productoId = Number(req.params.producto_id);
  if (!productoId) return res.status(400).json({ message: 'producto_id invalido' });

  try {
    const rows = await queryAsync(
      `SELECT r.id, r.producto_id, r.insumo_id, r.cantidad_por_unidad,
              i.nombre AS insumo_nombre, i.unidad
       FROM receta_producto_insumo r
       JOIN insumos i ON i.id = r.insumo_id
       WHERE r.producto_id = ?
       ORDER BY i.nombre ASC`,
      [productoId]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener receta de producto', error });
  }
};

export const upsertRecetaTopping = async (req, res) => {
  const toppingId = Number(req.params.topping_id);
  const { receta = [] } = req.body;

  if (!toppingId || !Array.isArray(receta)) {
    return res.status(400).json({ message: 'topping_id y receta[] son obligatorios' });
  }

  try {
    await queryAsync('DELETE FROM receta_topping_insumo WHERE topping_id = ?', [toppingId]);

    for (const item of receta) {
      const insumoId = Number(item.insumo_id);
      const cantidad = Number(item.cantidad_por_unidad);
      if (!insumoId || !Number.isFinite(cantidad) || cantidad <= 0) continue;

      await queryAsync(
        `INSERT INTO receta_topping_insumo (topping_id, insumo_id, cantidad_por_unidad)
         VALUES (?, ?, ?)`,
        [toppingId, insumoId, cantidad]
      );
    }

    res.json({ message: 'Receta de topping guardada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar receta de topping', error });
  }
};

export const getRecetaTopping = async (req, res) => {
  const toppingId = Number(req.params.topping_id);
  if (!toppingId) return res.status(400).json({ message: 'topping_id invalido' });

  try {
    const rows = await queryAsync(
      `SELECT r.id, r.topping_id, r.insumo_id, r.cantidad_por_unidad,
              i.nombre AS insumo_nombre, i.unidad
       FROM receta_topping_insumo r
       JOIN insumos i ON i.id = r.insumo_id
       WHERE r.topping_id = ?
       ORDER BY i.nombre ASC`,
      [toppingId]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener receta de topping', error });
  }
};

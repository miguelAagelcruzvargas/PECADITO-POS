import * as Ventas from "../models/ventas.js";
import db from "../db.js";
import TelegramService from "../services/TelegramService.js";

const queryTx = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const aplicarConsumoInsumos = async ({ id_negocio, producto_id, cantidad, topping_ids = [] }) => {
  const recetaProducto = await queryTx(
    `SELECT r.insumo_id, r.cantidad_por_unidad
     FROM receta_producto_insumo r
     JOIN insumos i ON i.id = r.insumo_id
     WHERE r.producto_id = ?
       AND i.negocio_id = ?
       AND i.activo = 1`,
    [producto_id, id_negocio]
  );

  const toppingIds = Array.isArray(topping_ids)
    ? [...new Set(topping_ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))]
    : [];

  let recetaToppings = [];
  if (toppingIds.length) {
    const placeholders = toppingIds.map(() => '?').join(',');
    recetaToppings = await queryTx(
      `SELECT r.insumo_id, r.cantidad_por_unidad
       FROM receta_topping_insumo r
       JOIN insumos i ON i.id = r.insumo_id
       WHERE r.topping_id IN (${placeholders})
         AND i.negocio_id = ?
         AND i.activo = 1`,
      [...toppingIds, id_negocio]
    );
  }

  const consumoPorInsumo = new Map();

  const acumular = (insumoId, cantidadBase) => {
    const previo = consumoPorInsumo.get(insumoId) || 0;
    consumoPorInsumo.set(insumoId, previo + cantidadBase);
  };

  const cantidadVenta = Number(cantidad) || 0;
  recetaProducto.forEach((r) => {
    acumular(Number(r.insumo_id), (Number(r.cantidad_por_unidad) || 0) * cantidadVenta);
  });
  recetaToppings.forEach((r) => {
    acumular(Number(r.insumo_id), (Number(r.cantidad_por_unidad) || 0) * cantidadVenta);
  });

  if (consumoPorInsumo.size === 0) return;

  const insumoIds = [...consumoPorInsumo.keys()];
  const placeholdersInsumo = insumoIds.map(() => '?').join(',');
  const rowsInsumo = await queryTx(
    `SELECT id, nombre, stock_actual
     FROM insumos
     WHERE negocio_id = ?
       AND id IN (${placeholdersInsumo})
     FOR UPDATE`,
    [id_negocio, ...insumoIds]
  );

  const stockMap = new Map(rowsInsumo.map((i) => [Number(i.id), i]));
  for (const [insumoId, consumo] of consumoPorInsumo.entries()) {
    const insumo = stockMap.get(insumoId);
    if (!insumo) {
      throw new Error(`Insumo ${insumoId} no encontrado para el negocio`);
    }
    if (Number(insumo.stock_actual) < consumo) {
      throw new Error(`Stock insuficiente de insumo: ${insumo.nombre} (disp: ${Number(insumo.stock_actual)}, req: ${consumo.toFixed(2)})`);
    }
  }

  for (const [insumoId, consumo] of consumoPorInsumo.entries()) {
    await queryTx(
      'UPDATE insumos SET stock_actual = stock_actual - ? WHERE id = ? AND negocio_id = ?',
      [consumo, insumoId, id_negocio]
    );
  }
};

// Crear un nuevo producto
export const crear = async (req, res) => {
  try {
    const { total, id_cliente, metodo_pago, id_negocio, usuario_id, canal_venta, turno_id } = req.body;
    const clienteIdNormalizado = id_cliente ? Number(id_cliente) : null;

    // Validación básica (total ahora opcional: se recalculará tras insertar detalles)
    if (!metodo_pago || !id_negocio) {
      return res.status(400).json({ message: "metodo_pago e id_negocio son obligatorios" });
    }

    // Objeto listo para guardar en la base de datos
    const ventaGeneradaBase = {
      total: total ?? 0,
      id_cliente: Number.isFinite(clienteIdNormalizado) ? clienteIdNormalizado : null,
      metodo_pago,
      id_negocio,
      usuario_id: usuario_id || null,
      turno_id: turno_id || null,
      canal_venta: canal_venta || 'Local'
    };

    const insertarVenta = (ventaGenerada) => {
      Ventas.createVenta(ventaGenerada, (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Error al crear el producto", error });
        }

        if (result?.existe) {
          return res.status(409).json({ message: "⚠️ El producto ya está registrado" });
        }

        res.status(201).json(result);
      });
    };

    // Si no mandan turno explícito, se toma el turno activo del empleado en su sucursal.
    if (!ventaGeneradaBase.turno_id && ventaGeneradaBase.usuario_id) {
      const sqlTurnoActivo = `
        SELECT t.id
        FROM turnos t
        JOIN usuarios u ON u.id = t.usuario_id
        WHERE t.usuario_id = ?
          AND u.negocios_id = ?
          AND t.fin IS NULL
        ORDER BY t.inicio DESC
        LIMIT 1
      `;
      db.query(sqlTurnoActivo, [ventaGeneradaBase.usuario_id, id_negocio], (errTurno, rowsTurno) => {
        if (errTurno) {
          return res.status(500).json({ message: "Error al validar turno activo", errTurno });
        }
        const ventaGenerada = {
          ...ventaGeneradaBase,
          turno_id: rowsTurno?.[0]?.id || null
        };
        insertarVenta(ventaGenerada);
      });
      return;
    }

    insertarVenta(ventaGeneradaBase);

  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};


export const obtenerValoresid = (req, res) => {
  const { id } = req.params;
  Ventas.getValoresById(id, (err, result) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error al obtener el valor' });
    }
  
  res.json(result || []);
  });
};

// Crear detalles de venta (para múltiples productos)
export const crearDetalle = async (req, res) => {
  const db = (await import('../db.js')).default;
  try {
    const productos = req.body;
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: 'El array de productos es obligatorio' });
    }

    db.beginTransaction(errTx => {
      if (errTx) return res.status(500).json({ message: 'No se pudo iniciar transacción', errTx });

      let index = 0;
      const ventaId = productos[0]?.venta_id;
      const id_negocio = productos[0]?.id_negocio;
      if(!ventaId) return db.rollback(() => res.status(400).json({ message: 'venta_id faltante' }));

      const procesar = () => {
        if (index >= productos.length) {
       
          Ventas.recomputeVentaTotalFromDetalles(ventaId, (errRecomp) => {
            if (errRecomp) return db.rollback(() => res.status(500).json({ message: 'Error al recalcular total', errRecomp }));
            return db.commit(errCommit => {
              if (errCommit) return db.rollback(() => res.status(500).json({ message: 'Error al confirmar transacción', errCommit }));

              (async () => {
                try {
                  const saleData = await queryTx(
                    `SELECT v.total, v.metodo_pago, n.nombre as nombre_negocio 
                     FROM ventas v 
                     JOIN negocios n ON n.id = v.id_negocio 
                     WHERE v.id = ?`, [ventaId]
                  );

                  const sale = saleData?.[0];

                  // Notificar si es transferencia
                  if (sale && sale.metodo_pago === 'Transferencia') {
                    await TelegramService.sendTransferNotification(id_negocio, {
                      negocioNombre: sale.nombre_negocio,
                      total: sale.total
                    });
                  }

                  const lowStockProducts = await queryTx(
                    `SELECT id, producto, stock
                     FROM inventario
                     WHERE negocio_id = ?
                       AND activo = 1
                       AND stock <= 10
                     ORDER BY stock ASC, producto ASC`,
                    [id_negocio]
                  );

                  const lowStockInsumos = await queryTx(
                    `SELECT id, nombre, unidad, stock_actual, stock_minimo
                     FROM insumos
                     WHERE negocio_id = ?
                       AND activo = 1
                       AND stock_actual <= stock_minimo
                     ORDER BY stock_actual ASC, nombre ASC`,
                    [id_negocio]
                  );

                  await TelegramService.sendInventoryLowStockAlert(id_negocio, {
                    products: lowStockProducts,
                    insumos: lowStockInsumos,
                  });
                } catch (telegramError) {
                  console.error('Error enviando notificaciones por Telegram:', telegramError.message || telegramError);
                }
              })();

              res.status(201).json({ message: 'Detalles creados, stock actualizado y total recalculado' });
            });
          });
          return;
        }
        const original = productos[index];
        const { venta_id, producto_id, cantidad, id_negocio, subtotal } = original;
        if (!venta_id || !producto_id || !cantidad || !id_negocio) {
          return db.rollback(() => res.status(400).json({ message: 'Campos obligatorios faltantes en un producto' }));
        }
        Ventas.getStockForUpdate(producto_id, (errStock, datosProd) => {
          if (errStock) return db.rollback(() => res.status(500).json({ message: 'Error al leer stock', errStock }));
          if (datosProd === null) return db.rollback(() => res.status(404).json({ message: `Producto ${producto_id} no encontrado` }));
          const { stock, precio } = datosProd;
            if (stock < cantidad) return db.rollback(() => res.status(400).json({ message: `Stock insuficiente para producto ${producto_id} (disp: ${stock}, req: ${cantidad})` }));
        
          const subtotalEnviado = Number(subtotal);
          const subtotalCalc = Number.isFinite(subtotalEnviado) && subtotalEnviado > 0
            ? subtotalEnviado
            : (Number(precio) * Number(cantidad));
          const detalle = { venta_id, producto_id, cantidad, subtotal: subtotalCalc, id_negocio };
          Ventas.descontarStockProducto(producto_id, cantidad, (errDesc) => {
            if (errDesc) return db.rollback(() => res.status(500).json({ message: 'Error al descontar stock', errDesc }));
            Ventas.createDetallesVenta(detalle, async (errDet) => {
              if (errDet) return db.rollback(() => res.status(500).json({ message: 'Error al crear detalle', errDet }));
              try {
                await aplicarConsumoInsumos({
                  id_negocio,
                  producto_id,
                  cantidad,
                  topping_ids: original?.topping_ids || []
                });
                index++;
                procesar();
              } catch (errInsumos) {
                return db.rollback(() => res.status(400).json({ message: errInsumos.message || 'Error al consumir insumos', errInsumos }));
              }
            });
          });
        });
      };
      procesar();
    });
  } catch (error) {
    console.error('Error en crearDetalle:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error });
  }
};

export const obtenerTopProductosMes = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "El id_negocio es obligatorio" });
    }

    Ventas.getTopProductosMes(id, (err, result) => {
        if (err) {
            console.error("Error al obtener los productos más vendidos:", err);
            return res.status(500).json({ message: "Error interno del servidor" });
        }
        return res.status(200).json(result);
    });
};

export const obtenerVentasPorMes = (req, res) => {
    const { id } = req.params;

    Ventas.getVentasPorMes(id, (error, results) => {
        if (error) {
            console.error("Error al obtener las ventas por mes:", error);
            return res.status(500).json({ message: "Error en la consulta", error });
        }

        res.status(200).json(results);
    });
};

export const obtenerTotalGeneralVentas = (req, res) => {
    const { id } = req.params;

    Ventas.getTotalGeneralVentas(id, (error, result) => {
        if (error) {
            console.error("Error al obtener el total general:", error);
            return res.status(500).json({ message: "Error al obtener el total general de ventas" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "No hay registros de ventas" });
        }

        res.status(200).json(result[0]); 
    });
};

export const getCantidadProductosVendidos = (req, res) => {
  const { id_negocio } = req.params;

  Ventas.obtenerCantidadProductosVendidos(id_negocio, (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener productos vendidos' });
    }
    res.json(data);
  });
};

export const getResumenMensual = (req, res) => {
  const { id } = req.params;

  Ventas.obtenerResumenMensual(id, (err, resumen) => {
    if (err) {
      console.error('Error al obtener el resumen mensual:', err);
      res.status(500).json({ error: 'Error al obtener el resumen mensual' });
    } else {
      res.json(resumen);
    }
  });
};

export const getReporteAvanzado = (req, res) => {
  const { id } = req.params;
  const { desde, hasta } = req.query;

  Ventas.obtenerReporteAvanzado(id, desde, hasta, (err, data) => {
    if (err) {
      console.error('Error al obtener reporte avanzado:', err);
      return res.status(500).json({ message: 'Error al obtener reporte avanzado' });
    }
    return res.json(data);
  });
};


export const eliminarVenta = (req, res) => {
  const { id } = req.params; // id de la venta
  const ventaId = Number(id);
  if (isNaN(ventaId)) return res.status(400).json({ message: 'ID inválido' });
  db.beginTransaction(errTx => {
    if (errTx) return res.status(500).json({ message: 'No se pudo iniciar transacción', errTx });

    Ventas.getDetallesByVenta(ventaId, (err, detalles) => {
      if (err) {
        return db.rollback(() => res.status(500).json({ message: 'Error al obtener detalles de la venta', err }));
      }

      const continuarEliminacion = () => {
        Ventas.deleteDetallesVenta(ventaId, (errDelDet) => {
          if (errDelDet) return db.rollback(() => res.status(500).json({ message: 'Error al borrar detalles', errDelDet }));
          Ventas.deleteVenta(ventaId, (errDelVenta, resultVenta) => {
            if (errDelVenta) return db.rollback(() => res.status(500).json({ message: 'Error al eliminar la venta', errDelVenta }));
            if (resultVenta.affectedRows === 0) return db.rollback(() => res.status(404).json({ message: 'Venta no encontrada' }));
            db.commit(errCommit => {
              if (errCommit) return db.rollback(() => res.status(500).json({ message: 'Error al confirmar transacción', errCommit }));
              return res.status(200).json({ message: detalles.length === 0 ? 'Venta eliminada (sin detalles)' : 'Venta eliminada y stock restaurado' });
            });
          });
        });
      };

      if (!detalles || detalles.length === 0) {
       
        Ventas.deleteDetallesVenta(ventaId, () => continuarEliminacion());
        return;
      }

     
      let idx = 0;
      const revertirUno = () => {
        if (idx >= detalles.length) return continuarEliminacion();
        const { producto_id, cantidad } = detalles[idx];
        Ventas.sumarStockProducto(producto_id, cantidad, (errStock) => {
          if (errStock) return db.rollback(() => res.status(500).json({ message: 'Error al restaurar stock', errStock }));
          idx++;
          revertirUno();
        });
      };
      revertirUno();
    });
  });
};
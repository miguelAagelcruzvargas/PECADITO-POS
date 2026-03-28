import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'elenapos',
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar:', err);
    return;
  }
  console.log('>>> Conectado a la base de datos MySQL');

  // Verificar/crear columnas para Identidad de Marca en negocios
  const checkNegColsSql = `SHOW COLUMNS FROM negocios LIKE 'rfc'`;
  db.query(checkNegColsSql, (errCols, rows) => {
    if (errCols) return;
    if (rows.length === 0) {
      db.query('ALTER TABLE negocios ADD COLUMN rfc VARCHAR(20), ADD COLUMN eslogan VARCHAR(255), ADD COLUMN logo VARCHAR(255)', (errAlter) => {
        if (!errAlter) console.log('>>> Columnas de identidad (rfc, eslogan, logo) añadidas a negocios');
      });
    }
  });

  // Verificar/crear columnas para Tickets en configuraciones
  // Normalizar columna de relacion en configuraciones a negocio_id
  const checkConfigNegocioIdSql = `SHOW COLUMNS FROM configuraciones LIKE 'negocio_id'`;
  db.query(checkConfigNegocioIdSql, (errCfgNegId, rowsCfgNegId) => {
    if (errCfgNegId) return;

    const ensureBackfillAndIndex = () => {
      const checkOldColSql = `SHOW COLUMNS FROM configuraciones LIKE 'id_negocio'`;
      db.query(checkOldColSql, (errOldCol, rowsOldCol) => {
        if (errOldCol) return;

        if (rowsOldCol.length > 0) {
          db.query('UPDATE configuraciones SET negocio_id = id_negocio WHERE negocio_id IS NULL', (errBackfill) => {
            if (!errBackfill) {
              console.log('>>> Backfill configuraciones.negocio_id desde id_negocio completado');
            }
          });
        }

        const checkCfgIdxSql = `SELECT 1 FROM information_schema.STATISTICS
          WHERE table_schema = DATABASE()
            AND table_name = 'configuraciones'
            AND index_name = 'idx_config_negocio_id'
          LIMIT 1`;

        db.query(checkCfgIdxSql, (errCfgIdx, rowsCfgIdx) => {
          if (errCfgIdx) return;
          if (rowsCfgIdx.length === 0) {
            db.query('ALTER TABLE configuraciones ADD INDEX idx_config_negocio_id (negocio_id)', (errAddCfgIdx) => {
              if (!errAddCfgIdx) console.log('>>> Índice configuraciones.idx_config_negocio_id creado');
            });
          }
        });
      });
    };

    if (rowsCfgNegId.length === 0) {
      db.query('ALTER TABLE configuraciones ADD COLUMN negocio_id INT NULL', (errAddCfgNegId) => {
        if (!errAddCfgNegId) {
          console.log('>>> Columna configuraciones.negocio_id añadida');
          ensureBackfillAndIndex();
        }
      });
      return;
    }

    ensureBackfillAndIndex();
  });

  const checkConfigColsSql = `SHOW COLUMNS FROM configuraciones LIKE 'ticket_show_logo'`;
  db.query(checkConfigColsSql, (errCnf, rowsCnf) => {
    if (errCnf) return;
    if (rowsCnf.length === 0) {
      db.query(`ALTER TABLE configuraciones 
        ADD COLUMN ticket_show_logo TINYINT(1) DEFAULT 1,
        ADD COLUMN ticket_show_rfc TINYINT(1) DEFAULT 1,
        ADD COLUMN ticket_show_address TINYINT(1) DEFAULT 1,
        ADD COLUMN ticket_show_phone TINYINT(1) DEFAULT 1,
        ADD COLUMN ticket_show_slogan TINYINT(1) DEFAULT 1,
        ADD COLUMN ticket_font_size INT DEFAULT 12,
        ADD COLUMN ticket_paper_size VARCHAR(10) DEFAULT '80mm',
        ADD COLUMN ticket_decoration VARCHAR(20) DEFAULT 'none'`, (errAlterCnf) => {
          if (!errAlterCnf) console.log('>>> Columnas de configuración de ticket añadidas');
        });
    }
  });

  const checkTelegramCleanupColsSql = `SHOW COLUMNS FROM configuraciones LIKE 'telegram_alert_auto_cleanup'`;
  db.query(checkTelegramCleanupColsSql, (errTelCfg, rowsTelCfg) => {
    if (errTelCfg) return;
    if (rowsTelCfg.length === 0) {
      db.query(`ALTER TABLE configuraciones
        ADD COLUMN telegram_alert_auto_cleanup TINYINT(1) DEFAULT 1,
        ADD COLUMN telegram_alert_retention_days INT DEFAULT 30`, (errAlterTelCfg) => {
          if (!errAlterTelCfg) console.log('>>> Columnas de limpieza Telegram añadidas en configuraciones');
        });
    }
  });

  // Verificar/crear índice compuesto para optimizar consultas y borrados masivos
  const checkIdxSql = `SELECT 1 FROM information_schema.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'detalle_venta'
      AND index_name = 'idx_detalle_venta_negocio_venta'
    LIMIT 1`;
  db.query(checkIdxSql, (errIdx, rows) => {
    if (errIdx) {
      console.warn('No se pudo verificar el índice compuesto detalle_venta:', errIdx.message);
      return;
    }
    if (rows.length === 0) {
      db.query('ALTER TABLE detalle_venta ADD INDEX idx_detalle_venta_negocio_venta (id_negocio, venta_id)', (errAdd) => {
        if (errAdd) {
          console.warn('No se pudo crear índice compuesto detalle_venta:', errAdd.message);
        } else {
          console.log('>>> Índice compuesto creado: idx_detalle_venta_negocio_venta (id_negocio, venta_id)');
        }
      });
    }
  });

  // Verificar/crear columnas para trazabilidad de ventas por usuario/turno/canal
  const checkVentaUsuarioColSql = `SHOW COLUMNS FROM ventas LIKE 'usuario_id'`;
  db.query(checkVentaUsuarioColSql, (errVUser, rowsVUser) => {
    if (errVUser) return;
    if (rowsVUser.length === 0) {
      db.query('ALTER TABLE ventas ADD COLUMN usuario_id INT NULL AFTER id_negocio', (errAlterVUser) => {
        if (!errAlterVUser) console.log('>>> Columna ventas.usuario_id añadida');
      });
    }
  });

  const checkVentaTurnoColSql = `SHOW COLUMNS FROM ventas LIKE 'turno_id'`;
  db.query(checkVentaTurnoColSql, (errVTurno, rowsVTurno) => {
    if (errVTurno) return;
    if (rowsVTurno.length === 0) {
      db.query('ALTER TABLE ventas ADD COLUMN turno_id INT NULL AFTER usuario_id', (errAlterVTurno) => {
        if (!errAlterVTurno) console.log('>>> Columna ventas.turno_id añadida');
      });
    }
  });

  const checkVentaCanalColSql = `SHOW COLUMNS FROM ventas LIKE 'canal_venta'`;
  db.query(checkVentaCanalColSql, (errVCanal, rowsVCanal) => {
    if (errVCanal) return;
    if (rowsVCanal.length === 0) {
      db.query("ALTER TABLE ventas ADD COLUMN canal_venta VARCHAR(20) NOT NULL DEFAULT 'Local' AFTER turno_id", (errAlterVCanal) => {
        if (!errAlterVCanal) console.log('>>> Columna ventas.canal_venta añadida');
      });
    }
  });
  // Agregar columna para guardar el nombre del usuario al momento de la venta
  const checkVentaUsuarioNombreColSql = `SHOW COLUMNS FROM ventas LIKE 'usuario_nombre'`;
  db.query(checkVentaUsuarioNombreColSql, (errVUNombre, rowsVUNombre) => {
    if (errVUNombre) return;
    if (rowsVUNombre.length === 0) {
      db.query("ALTER TABLE ventas ADD COLUMN usuario_nombre VARCHAR(255) NULL AFTER usuario_id", (errAlterVUNombre) => {
        if (!errAlterVUNombre) console.log('>>> Columna ventas.usuario_nombre añadida');
      });
    }
  });
  // Permitir ventas de mostrador sin cliente registrado
  const checkVentaClienteColSql = `SHOW COLUMNS FROM ventas LIKE 'id_cliente'`;
  db.query(checkVentaClienteColSql, (errVCliente, rowsVCliente) => {
    if (errVCliente || rowsVCliente.length === 0) return;
    const nullState = rowsVCliente[0]?.Null;
    if (nullState === 'NO') {
      db.query('ALTER TABLE ventas MODIFY COLUMN id_cliente INT NULL', (errAlterVCliente) => {
        if (!errAlterVCliente) console.log('>>> Columna ventas.id_cliente ahora permite NULL (cliente mostrador)');
      });
    }
  });

  // Verificar/crear columnas de confirmación en pedidos digitales
  const checkPedidoConfirmadoPorSql = `SHOW COLUMNS FROM pedidos_digitales LIKE 'confirmado_por'`;
  db.query(checkPedidoConfirmadoPorSql, (errCP, rowsCP) => {
    if (errCP) return;
    if (rowsCP.length === 0) {
      db.query('ALTER TABLE pedidos_digitales ADD COLUMN confirmado_por INT NULL AFTER status', (errAlterCP) => {
        if (!errAlterCP) console.log('>>> Columna pedidos_digitales.confirmado_por añadida');
      });
    }
  });

  const checkPedidoConfirmadoEnSql = `SHOW COLUMNS FROM pedidos_digitales LIKE 'confirmado_en'`;
  db.query(checkPedidoConfirmadoEnSql, (errCE, rowsCE) => {
    if (errCE) return;
    if (rowsCE.length === 0) {
      db.query('ALTER TABLE pedidos_digitales ADD COLUMN confirmado_en DATETIME NULL AFTER confirmado_por', (errAlterCE) => {
        if (!errAlterCE) console.log('>>> Columna pedidos_digitales.confirmado_en añadida');
      });
    }
  });

  // Asegurar que el estado soporte flujo intermedio "En preparacion"
  const checkPedidoStatusSql = `SHOW COLUMNS FROM pedidos_digitales LIKE 'status'`;
  db.query(checkPedidoStatusSql, (errStatus, rowsStatus) => {
    if (errStatus || rowsStatus.length === 0) return;

    const statusType = String(rowsStatus[0]?.Type || '').toLowerCase();
    if (!statusType.includes('en preparacion')) {
      db.query(
        "ALTER TABLE pedidos_digitales MODIFY COLUMN status ENUM('Pendiente','En preparacion','Confirmado','Rechazado') DEFAULT 'Pendiente'",
        (errAlterStatus) => {
          if (!errAlterStatus) {
            console.log('>>> Columna pedidos_digitales.status actualizada con estado En preparacion');
          }
        }
      );
    }

    // Recupera registros que pudieron quedar vacíos por ENUM inválido antes del ajuste
    db.query(
      "UPDATE pedidos_digitales SET status = 'En preparacion' WHERE status = ''",
      (errFixEmpty) => {
        if (!errFixEmpty) console.log('>>> Estados vacíos en pedidos_digitales normalizados a En preparacion');
      }
    );
  });

  const checkPedidoTipoEntregaSql = `SHOW COLUMNS FROM pedidos_digitales LIKE 'tipo_entrega'`;
  db.query(checkPedidoTipoEntregaSql, (errTE, rowsTE) => {
    if (errTE) return;
    if (rowsTE.length === 0) {
      db.query("ALTER TABLE pedidos_digitales ADD COLUMN tipo_entrega VARCHAR(20) NOT NULL DEFAULT 'Recoger' AFTER status", (errAlterTE) => {
        if (!errAlterTE) console.log('>>> Columna pedidos_digitales.tipo_entrega añadida');
      });
    }
  });

  const checkPedidoCanalOrigenSql = `SHOW COLUMNS FROM pedidos_digitales LIKE 'canal_origen'`;
  db.query(checkPedidoCanalOrigenSql, (errCanal, rowsCanal) => {
    if (errCanal) return;
    if (rowsCanal.length === 0) {
      db.query("ALTER TABLE pedidos_digitales ADD COLUMN canal_origen VARCHAR(30) NOT NULL DEFAULT 'Menu Digital' AFTER negocio_id", (errAlterCanal) => {
        if (!errAlterCanal) console.log('>>> Columna pedidos_digitales.canal_origen añadida');
      });
    }
  });

  const checkPedidoContactoSql = `SHOW COLUMNS FROM pedidos_digitales LIKE 'contacto_cliente'`;
  db.query(checkPedidoContactoSql, (errContacto, rowsContacto) => {
    if (errContacto) return;
    if (rowsContacto.length === 0) {
      db.query('ALTER TABLE pedidos_digitales ADD COLUMN contacto_cliente VARCHAR(40) NULL AFTER canal_origen', (errAlterContacto) => {
        if (!errAlterContacto) console.log('>>> Columna pedidos_digitales.contacto_cliente añadida');
      });
    }
  });

  const checkPedidoNotasSql = `SHOW COLUMNS FROM pedidos_digitales LIKE 'notas_cliente'`;
  db.query(checkPedidoNotasSql, (errNotas, rowsNotas) => {
    if (errNotas) return;
    if (rowsNotas.length === 0) {
      db.query('ALTER TABLE pedidos_digitales ADD COLUMN notas_cliente TEXT NULL AFTER contacto_cliente', (errAlterNotas) => {
        if (!errAlterNotas) console.log('>>> Columna pedidos_digitales.notas_cliente añadida');
      });
    }
  });

  const checkPedidoEntregaDetalleSql = `SHOW COLUMNS FROM pedidos_digitales LIKE 'entrega_detalle'`;
  db.query(checkPedidoEntregaDetalleSql, (errED, rowsED) => {
    if (errED) return;
    if (rowsED.length === 0) {
      db.query('ALTER TABLE pedidos_digitales ADD COLUMN entrega_detalle TEXT NULL AFTER tipo_entrega', (errAlterED) => {
        if (!errAlterED) console.log('>>> Columna pedidos_digitales.entrega_detalle añadida');
      });
    }
  });

  const checkPedidoEntregaLatSql = `SHOW COLUMNS FROM pedidos_digitales LIKE 'entrega_lat'`;
  db.query(checkPedidoEntregaLatSql, (errLat, rowsLat) => {
    if (errLat) return;
    if (rowsLat.length === 0) {
      db.query('ALTER TABLE pedidos_digitales ADD COLUMN entrega_lat DECIMAL(10,7) NULL AFTER entrega_detalle', (errAlterLat) => {
        if (!errAlterLat) console.log('>>> Columna pedidos_digitales.entrega_lat añadida');
      });
    }
  });

  const checkPedidoEntregaLngSql = `SHOW COLUMNS FROM pedidos_digitales LIKE 'entrega_lng'`;
  db.query(checkPedidoEntregaLngSql, (errLng, rowsLng) => {
    if (errLng) return;
    if (rowsLng.length === 0) {
      db.query('ALTER TABLE pedidos_digitales ADD COLUMN entrega_lng DECIMAL(10,7) NULL AFTER entrega_lat', (errAlterLng) => {
        if (!errAlterLng) console.log('>>> Columna pedidos_digitales.entrega_lng añadida');
      });
    }
  });

  // Tablas base para control de insumos (piezas/gramos/ml) y recetas de consumo
  db.query(`
    CREATE TABLE IF NOT EXISTS insumos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      unidad ENUM('pza','g','ml') NOT NULL DEFAULT 'pza',
      stock_actual DECIMAL(12,2) NOT NULL DEFAULT 0,
      stock_minimo DECIMAL(12,2) NOT NULL DEFAULT 0,
      negocio_id INT NOT NULL,
      activo TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_insumos_negocio (negocio_id),
      UNIQUE KEY uk_insumo_negocio_nombre (negocio_id, nombre)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `, (errInsumos) => {
    if (!errInsumos) console.log('>>> Tabla insumos verificada');
  });

  db.query(`
    CREATE TABLE IF NOT EXISTS receta_producto_insumo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      producto_id INT NOT NULL,
      insumo_id INT NOT NULL,
      cantidad_por_unidad DECIMAL(12,3) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_receta_producto_insumo (producto_id, insumo_id),
      INDEX idx_rpi_producto (producto_id),
      INDEX idx_rpi_insumo (insumo_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `, (errRecetaProd) => {
    if (!errRecetaProd) console.log('>>> Tabla receta_producto_insumo verificada');
  });

  db.query(`
    CREATE TABLE IF NOT EXISTS receta_topping_insumo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      topping_id INT NOT NULL,
      insumo_id INT NOT NULL,
      cantidad_por_unidad DECIMAL(12,3) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_receta_topping_insumo (topping_id, insumo_id),
      INDEX idx_rti_topping (topping_id),
      INDEX idx_rti_insumo (insumo_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `, (errRecetaTop) => {
    if (!errRecetaTop) console.log('>>> Tabla receta_topping_insumo verificada');
  });

  db.query(`
    CREATE TABLE IF NOT EXISTS telegram_alert_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      negocio_id INT NOT NULL,
      alert_type VARCHAR(50) NOT NULL,
      signature TEXT NOT NULL,
      last_sent_at DATETIME NOT NULL,
      sent_count INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_telegram_alert_log (negocio_id, alert_type, signature(255)),
      INDEX idx_telegram_alert_negocio_tipo (negocio_id, alert_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `, (errTelegramLog) => {
    if (!errTelegramLog) console.log('>>> Tabla telegram_alert_log verificada');
  });
});

export default db;

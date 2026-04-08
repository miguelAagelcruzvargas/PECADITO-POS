import db, { triggerSyncUpdate } from '../db.js';
import TelegramService from '../services/TelegramService.js';

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const ensureConfiguracionesSchema = async () => {
  const columns = await queryAsync('SHOW COLUMNS FROM configuraciones');
  const fieldSet = new Set(columns.map((c) => c.Field));

  if (!fieldSet.has('negocio_id')) {
    await queryAsync('ALTER TABLE configuraciones ADD COLUMN negocio_id INT NULL');
    if (fieldSet.has('id_negocio')) {
      await queryAsync('UPDATE configuraciones SET negocio_id = id_negocio WHERE negocio_id IS NULL');
    }
  } else if (fieldSet.has('id_negocio')) {
    await queryAsync('UPDATE configuraciones SET negocio_id = id_negocio WHERE negocio_id IS NULL');
  }

  const requiredColumns = [
    { name: 'telegram_token', ddl: 'ALTER TABLE configuraciones ADD COLUMN telegram_token TEXT NULL' },
    { name: 'telegram_chat_id', ddl: 'ALTER TABLE configuraciones ADD COLUMN telegram_chat_id VARCHAR(255) NULL' },
    { name: 'telegram_alert_auto_cleanup', ddl: 'ALTER TABLE configuraciones ADD COLUMN telegram_alert_auto_cleanup TINYINT(1) DEFAULT 1' },
    { name: 'telegram_alert_retention_days', ddl: 'ALTER TABLE configuraciones ADD COLUMN telegram_alert_retention_days INT DEFAULT 30' },
    { name: 'ticket_show_logo', ddl: 'ALTER TABLE configuraciones ADD COLUMN ticket_show_logo TINYINT(1) DEFAULT 1' },
    { name: 'ticket_show_rfc', ddl: 'ALTER TABLE configuraciones ADD COLUMN ticket_show_rfc TINYINT(1) DEFAULT 1' },
    { name: 'ticket_show_address', ddl: 'ALTER TABLE configuraciones ADD COLUMN ticket_show_address TINYINT(1) DEFAULT 1' },
    { name: 'ticket_show_phone', ddl: 'ALTER TABLE configuraciones ADD COLUMN ticket_show_phone TINYINT(1) DEFAULT 1' },
    { name: 'ticket_show_slogan', ddl: 'ALTER TABLE configuraciones ADD COLUMN ticket_show_slogan TINYINT(1) DEFAULT 1' },
    { name: 'ticket_font_size', ddl: 'ALTER TABLE configuraciones ADD COLUMN ticket_font_size INT DEFAULT 12' },
    { name: 'ticket_paper_size', ddl: "ALTER TABLE configuraciones ADD COLUMN ticket_paper_size VARCHAR(10) DEFAULT '80mm'" },
    { name: 'ticket_decoration', ddl: "ALTER TABLE configuraciones ADD COLUMN ticket_decoration VARCHAR(20) DEFAULT 'none'" },
    { name: 'banco_nombre', ddl: 'ALTER TABLE configuraciones ADD COLUMN banco_nombre VARCHAR(100) NULL' },
    { name: 'banco_titular', ddl: 'ALTER TABLE configuraciones ADD COLUMN banco_titular VARCHAR(150) NULL' },
    { name: 'banco_cuenta', ddl: 'ALTER TABLE configuraciones ADD COLUMN banco_cuenta VARCHAR(50) NULL' },
    { name: 'banco_clabe', ddl: 'ALTER TABLE configuraciones ADD COLUMN banco_clabe VARCHAR(18) NULL' },
    { name: 'banco_concepto', ddl: 'ALTER TABLE configuraciones ADD COLUMN banco_concepto VARCHAR(100) NULL' },
    { name: 'menu_activo', ddl: 'ALTER TABLE configuraciones ADD COLUMN menu_activo TINYINT(1) DEFAULT 1' },
    { name: 'horarios', ddl: 'ALTER TABLE configuraciones ADD COLUMN horarios TEXT NULL' },
    { name: 'mensaje_especial', ddl: 'ALTER TABLE configuraciones ADD COLUMN mensaje_especial TEXT NULL' }
  ];

  const refreshedColumns = await queryAsync('SHOW COLUMNS FROM configuraciones');
  const refreshedSet = new Set(refreshedColumns.map((c) => c.Field));

  for (const col of requiredColumns) {
    if (!refreshedSet.has(col.name)) {
      await queryAsync(col.ddl);
    }
  }
};

const buildDefaultConfig = (id_negocio) => ({
  negocio_id: id_negocio,
  telegram_token: '',
  telegram_chat_id: '',
  telegram_alert_auto_cleanup: 1,
  telegram_alert_retention_days: 30,
  ticket_show_logo: 1,
  ticket_show_rfc: 1,
  ticket_show_address: 1,
  ticket_show_phone: 1,
  ticket_show_slogan: 1,
  ticket_font_size: 12,
  ticket_paper_size: '80mm',
  ticket_decoration: 'none',
  banco_nombre: '',
  banco_titular: '',
  banco_cuenta: '',
  banco_clabe: '',
  banco_concepto: '',
  menu_activo: 1,
  horarios: JSON.stringify({
    Lunes: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Martes: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Miercoles: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Jueves: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Viernes: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Sabado: { abierto: true, apertura: "09:00", cierre: "21:00" },
    Domingo: { abierto: false, apertura: "09:00", cierre: "21:00" }
  })
});

export const getConfig = (req, res) => {
  const { id_negocio } = req.params;

  (async () => {
    try {
      await ensureConfiguracionesSchema();

      const results = await queryAsync('SELECT * FROM configuraciones WHERE negocio_id = ?', [id_negocio]);

      if (!results.length) {
        await queryAsync('INSERT INTO configuraciones (negocio_id) VALUES (?)', [id_negocio]);
        return res.json(buildDefaultConfig(id_negocio));
      }

      return res.json(results[0]);
    } catch (err) {
      return res.status(500).json(err);
    }
  })();
};

export const updateConfig = (req, res) => {
  const { id_negocio } = req.params;
  const { 
    telegram_token, 
    telegram_chat_id,
    telegram_alert_auto_cleanup,
    telegram_alert_retention_days,
    ticket_show_logo,
    ticket_show_rfc,
    ticket_show_address,
    ticket_show_phone,
    ticket_show_slogan,
    ticket_font_size,
    ticket_paper_size,
    ticket_decoration,
    banco_nombre,
    banco_titular,
    banco_cuenta,
    banco_clabe,
    banco_concepto,
    menu_activo,
    horarios,
    mensaje_especial
  } = req.body;

  (async () => {
    try {
      await ensureConfiguracionesSchema();

      const existing = await queryAsync('SELECT id FROM configuraciones WHERE negocio_id = ? LIMIT 1', [id_negocio]);
      if (!existing.length) {
        await queryAsync('INSERT INTO configuraciones (negocio_id) VALUES (?)', [id_negocio]);
      }

      const sql = `UPDATE configuraciones SET 
        telegram_token = ?, 
        telegram_chat_id = ?, 
        telegram_alert_auto_cleanup = ?,
        telegram_alert_retention_days = ?,
        ticket_show_logo = ?,
        ticket_show_rfc = ?,
        ticket_show_address = ?,
        ticket_show_phone = ?,
        ticket_show_slogan = ?,
        ticket_font_size = ?,
        ticket_paper_size = ?,
        ticket_decoration = ?,
        banco_nombre = ?,
        banco_titular = ?,
        banco_cuenta = ?,
        banco_clabe = ?,
        banco_concepto = ?,
        menu_activo = ?,
        horarios = ?,
        mensaje_especial = ?
        WHERE negocio_id = ?`;

      const values = [
        telegram_token ?? '',
        telegram_chat_id ?? '',
        telegram_alert_auto_cleanup ?? 1,
        telegram_alert_retention_days ?? 30,
        ticket_show_logo ?? 1,
        ticket_show_rfc ?? 1,
        ticket_show_address ?? 1,
        ticket_show_phone ?? 1,
        ticket_show_slogan ?? 1,
        ticket_font_size ?? 12,
        ticket_paper_size ?? '80mm',
        ticket_decoration ?? 'none',
        banco_nombre ?? '',
        banco_titular ?? '',
        banco_cuenta ?? '',
        banco_clabe ?? '',
        banco_concepto ?? '',
        menu_activo ?? 1,
        horarios ? (typeof horarios === 'string' ? horarios : JSON.stringify(horarios)) : null,
        mensaje_especial ?? '',
        id_negocio
      ];

      await queryAsync(sql, values);
      triggerSyncUpdate(id_negocio);
      return res.json({ message: 'Configuración actualizada' });
    } catch (err) {
      return res.status(500).json(err);
    }
  })();
};

export const testTelegram = (req, res) => {
  const { id_negocio } = req.params;
  const { telegram_token, telegram_chat_id } = req.body;

  (async () => {
    try {
      await ensureConfiguracionesSchema();

      let token = telegram_token;
      let chatId = telegram_chat_id;

      if (!token || !chatId) {
        const results = await queryAsync('SELECT telegram_token, telegram_chat_id FROM configuraciones WHERE negocio_id = ? LIMIT 1', [id_negocio]);
        token = token || results?.[0]?.telegram_token;
        chatId = chatId || results?.[0]?.telegram_chat_id;
      }

      if (!token || !chatId) {
        return res.status(400).json({ message: 'Token y chat ID son obligatorios para la prueba.' });
      }

      const time = new Date().toLocaleString('es-MX');
      await TelegramService.sendDirectMessage(
        token,
        chatId,
        `🧪 <b>Prueba de Telegram</b>\n\nNegocio ID: ${id_negocio}\nHora: ${time}\n\nSi recibes este mensaje, la integración funciona correctamente.`
      );

      return res.json({ message: 'Mensaje de prueba enviado correctamente.' });
    } catch (err) {
      return res.status(500).json({ message: err.message || 'No se pudo enviar la prueba de Telegram.' });
    }
  })();
};

export const sendStockAlertNow = (req, res) => {
  const { id_negocio } = req.params;

  (async () => {
    try {
      const products = await queryAsync(
        `SELECT id, producto, stock
         FROM inventario
         WHERE negocio_id = ?
           AND activo = 1
           AND stock <= 10
         ORDER BY stock ASC, producto ASC`,
        [id_negocio]
      );

      const insumos = await queryAsync(
        `SELECT id, nombre, unidad, stock_actual, stock_minimo
         FROM insumos
         WHERE negocio_id = ?
           AND activo = 1
           AND stock_actual <= stock_minimo
         ORDER BY stock_actual ASC, nombre ASC`,
        [id_negocio]
      );

      if (products.length === 0 && insumos.length === 0) {
        return res.status(400).json({ message: 'No hay productos ni insumos con stock bajo para enviar.' });
      }

      await TelegramService.sendInventoryLowStockAlert(
        id_negocio,
        { products, insumos },
        { force: true }
      );

      return res.json({
        message: 'Alerta de stock enviada correctamente.',
        totals: {
          products: products.length,
          insumos: insumos.length,
        }
      });
    } catch (err) {
      return res.status(500).json({ message: err.message || 'No se pudo enviar la alerta de stock.' });
    }
  })();
};

export const getAlertLogStats = (req, res) => {
  const { id_negocio } = req.params;

  (async () => {
    try {
      const rows = await queryAsync(
        `SELECT
          COUNT(*) AS total,
          MAX(last_sent_at) AS last_sent_at,
          COALESCE(SUM(sent_count), 0) AS sent_count_total
         FROM telegram_alert_log
         WHERE negocio_id = ?`,
        [id_negocio]
      );

      const row = rows?.[0] || { total: 0, last_sent_at: null, sent_count_total: 0 };
      return res.json({
        total: Number(row.total || 0),
        last_sent_at: row.last_sent_at || null,
        sent_count_total: Number(row.sent_count_total || 0)
      });
    } catch (err) {
      return res.status(500).json({ message: err.message || 'No se pudo obtener el historial de alertas.' });
    }
  })();
};

export const clearAlertLog = (req, res) => {
  const { id_negocio } = req.params;

  (async () => {
    try {
      const result = await queryAsync('DELETE FROM telegram_alert_log WHERE negocio_id = ?', [id_negocio]);
      return res.json({
        message: 'Historial de alertas eliminado correctamente.',
        deleted: Number(result?.affectedRows || 0)
      });
    } catch (err) {
      return res.status(500).json({ message: err.message || 'No se pudo limpiar el historial de alertas.' });
    }
  })();
};

// Endpoint público: datos de transferencia bancaria para el menú digital
export const getTransferData = (req, res) => {
  const { id_negocio } = req.params;
  (async () => {
    try {
      await ensureConfiguracionesSchema();
      const results = await queryAsync(
        'SELECT banco_nombre, banco_titular, banco_cuenta, banco_clabe, banco_concepto FROM configuraciones WHERE negocio_id = ? LIMIT 1',
        [id_negocio]
      );
      if (!results.length) return res.json({ banco_nombre: '', banco_titular: '', banco_cuenta: '', banco_clabe: '', banco_concepto: '' });
      return res.json(results[0]);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  })();
};

import axios from 'axios';
import db from '../db.js';

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

class TelegramService {
  constructor() {
    this.token = null;
    this.chatId = null;
    this.lastCleanupByBusiness = new Map();
    this.sending = new Set(); // Bloqueo para evitar duplicados simultáneos
  }

  async getAlertCleanupConfig(negocioId) {
    const rows = await queryAsync(
      `SELECT
        COALESCE(telegram_alert_auto_cleanup, 1) AS auto_cleanup,
        COALESCE(telegram_alert_retention_days, 30) AS retention_days
       FROM configuraciones
       WHERE negocio_id = ?
       LIMIT 1`,
      [negocioId]
    );

    if (!rows.length) {
      return { autoCleanup: true, retentionDays: 30 };
    }

    const autoCleanup = Number(rows[0].auto_cleanup) !== 0;
    const parsedDays = Number(rows[0].retention_days);
    const retentionDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 30;

    return { autoCleanup, retentionDays };
  }

  async cleanupOldAlertLogs(negocioId) {
    const now = Date.now();
    const cleanupIntervalMs = 60 * 60 * 1000;
    const lastCleanupAt = this.lastCleanupByBusiness.get(String(negocioId)) || 0;

    if (now - lastCleanupAt < cleanupIntervalMs) {
      return;
    }

    const { autoCleanup, retentionDays } = await this.getAlertCleanupConfig(negocioId);
    if (!autoCleanup) {
      return;
    }

    this.lastCleanupByBusiness.set(String(negocioId), now);

    await queryAsync(
      `DELETE FROM telegram_alert_log
       WHERE negocio_id = ?
         AND last_sent_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [negocioId, retentionDays]
    );
  }

  async shouldSendAlert(negocioId, alertType, signature, cooldownMs = 30 * 60 * 1000) {
    const rows = await queryAsync(
      `SELECT last_sent_at
       FROM telegram_alert_log
       WHERE negocio_id = ? AND alert_type = ? AND signature = ?
       LIMIT 1`,
      [negocioId, alertType, signature]
    );

    if (!rows.length) return true;

    const lastSentAt = new Date(rows[0].last_sent_at).getTime();
    return Date.now() - lastSentAt >= cooldownMs;
  }

  async markAlertSent(negocioId, alertType, signature) {
    await queryAsync(
      `INSERT INTO telegram_alert_log (negocio_id, alert_type, signature, last_sent_at, sent_count)
       VALUES (?, ?, ?, NOW(), 1)
       ON DUPLICATE KEY UPDATE
         last_sent_at = NOW(),
         sent_count = sent_count + 1`,
      [negocioId, alertType, signature]
    );

    this.cleanupOldAlertLogs(negocioId).catch((error) => {
      console.error('Error limpiando historial de alertas Telegram:', error.message || error);
    });
  }

  async loadConfig(negocioId) {
    const sql = 'SELECT telegram_token, telegram_chat_id FROM configuraciones WHERE negocio_id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [negocioId], (err, results) => {
        if (err) return reject(err);
        if (results.length > 0) {
          this.token = results[0].telegram_token;
          this.chatId = results[0].telegram_chat_id;
        }
        resolve(results.length > 0);
      });
    });
  }

  async sendMessage(negocioId, message) {
    await this.loadConfig(negocioId);
    if (!this.token || !this.chatId) return;

    return this.sendDirectMessage(this.token, this.chatId, message);
  }

  async sendDirectMessage(token, chatId, message) {
    if (!token || !chatId) {
      throw new Error('Token o chat_id faltantes');
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });
      return response.data;
    } catch (error) {
      console.error('Error enviando mensaje a Telegram:', error.response?.data || error.message);
      throw new Error(error.response?.data?.description || error.message || 'No se pudo enviar el mensaje a Telegram');
    }
  }

  async sendLowStockAlert(negocioId, products, options = {}) {
    if (products.length === 0) return;

    const signature = `products:${products
      .map((p) => `${p.id || p.producto}-${p.stock}`)
      .sort()
      .join('|')}`;
    
    // Evitar duplicados simultáneos (Race Condition)
    const lockKey = `${negocioId}:low_stock_products:${signature}`;
    if (this.sending.has(lockKey)) return;
    this.sending.add(lockKey);

    try {
      if (!options.force && !(await this.shouldSendAlert(negocioId, 'low_stock_products', signature))) return;
      
      let message = `⚠️ <b>ALERTA DE STOCK BAJO</b>\n\n`;
      products.forEach(p => {
        message += `• ${p.producto}: ${p.stock} unidades\n`;
      });
      
      await this.sendMessage(negocioId, message);
      await this.markAlertSent(negocioId, 'low_stock_products', signature);
    } finally {
      this.sending.delete(lockKey);
    }
  }

  async sendInventoryLowStockAlert(negocioId, { products = [], insumos = [] } = {}, options = {}) {
    if (products.length === 0 && insumos.length === 0) return;

    const signature = [
      `products:${products.map((p) => `${p.id || p.producto}-${p.stock}`).sort().join('|')}`,
      `insumos:${insumos.map((i) => `${i.id || i.nombre}-${i.stock_actual}`).sort().join('|')}`
    ].join('||');

    // Evitar duplicados simultáneos
    const lockKey = `${negocioId}:inventory_low_stock:${signature}`;
    if (this.sending.has(lockKey)) return;
    this.sending.add(lockKey);

    try {
      if (!options.force && !(await this.shouldSendAlert(negocioId, 'inventory_low_stock', signature))) return;

      let message = `⚠️ <b>ALERTA DE STOCK BAJO</b>\n\n`;

      if (products.length > 0) {
        message += `<b>Productos:</b>\n`;
        products.forEach((p) => {
          message += `• ${p.producto}: ${p.stock} unidades\n`;
        });
        message += `\n`;
      }

      if (insumos.length > 0) {
        message += `<b>Insumos:</b>\n`;
        insumos.forEach((i) => {
          message += `• ${i.nombre}: ${i.stock_actual} ${i.unidad}\n`;
        });
      }

      await this.sendMessage(negocioId, message);
      await this.markAlertSent(negocioId, 'inventory_low_stock', signature);
    } finally {
      this.sending.delete(lockKey);
    }
  }

  async sendDailySummary(negocioId, summary) {
    let message = `📊 <b>RESUMEN DIARIO DE VENTAS</b>\n\n`;
    message += `💰 Total del día: $${summary.total}\n`;
    message += `📋 Número de ventas: ${summary.num_ventas}\n`;
    message += `🕒 Hora: ${new Date().toLocaleTimeString()}\n`;
    
    await this.sendMessage(negocioId, message);
  }

  async sendShiftClosingReport(negocioId, data) {
    const { 
      negocioNombre, empleadoNombre, totalVentas, totalEfectivo, 
      totalTransferencia, totalGastos, montoEsperado, montoDeclarado, diferencia 
    } = data;

    let message = `🏁 <b>CIERRE DE TURNO DETALLADO</b>\n\n`;
    message += `📍 <b>Sucursal:</b> ${negocioNombre}\n`;
    message += `👤 <b>Empleado:</b> ${empleadoNombre}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    message += `💰 <b>RESUMEN DE VENTAS</b>\n`;
    message += `• Total Ventas: $${Number(totalVentas).toFixed(2)}\n`;
    message += `  ﹂ 💵 Efectivo: $${Number(totalEfectivo).toFixed(2)}\n`;
    message += `  ﹂ 💳 Transfer: $${Number(totalTransferencia).toFixed(2)}\n\n`;
    
    message += `💸 <b>MOVIMIENTOS DE CAJA</b>\n`;
    message += `• Gastos/Egresos: $${Number(totalGastos).toFixed(2)}\n\n`;
    
    message += `📊 <b>AUDITORÍA DE CAJA</b>\n`;
    message += `• Esperado: $${Number(montoEsperado).toFixed(2)}\n`;
    message += `• Declarado: $${Number(montoDeclarado).toFixed(2)}\n`;
    
    if (Math.abs(diferencia) < 0.01) {
      message += `✅ <b>¡Caja Cuadrada!</b>\n`;
    } else if (diferencia < 0) {
      message += `❌ <b>FALTANTE: -$${Math.abs(diferencia).toFixed(2)}</b>\n`;
    } else {
      message += `⚠️ <b>SOBRANTE: +$${Math.abs(diferencia).toFixed(2)}</b>\n`;
    }

    message += `\n🕒 <b>Cierre:</b> ${new Date().toLocaleString('es-MX')}`;

    return this.sendMessage(negocioId, message);
  }

  async sendTransferNotification(negocioId, { negocioNombre, total }) {
    let message = `🏦 <b>¡NUEVA TRANSFERENCIA RECIBIDA!</b>\n\n`;
    message += `📍 <b>Sucursal:</b> ${negocioNombre}\n`;
    message += `💰 <b>Monto:</b> $${Number(total).toFixed(2)}\n`;
    message += `🕒 <b>Hora:</b> ${new Date().toLocaleString('es-MX')}\n\n`;
    message += `📌 <i>Por favor, verifica tu banca para confirmar el depósito.</i>`;

    return this.sendMessage(negocioId, message);
  }
}

export default new TelegramService();

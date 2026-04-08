import db, { triggerSyncUpdate } from '../db.js';

export const getPromocionesByNegocio = (negocioId, callback) => {
    const sql = `
        SELECT p.*, i.producto, i.presentacion, i.imagen, i.precio as precio_original
        FROM promociones p
        JOIN inventario i ON p.inventario_id = i.id
        WHERE p.negocio_id = ? AND p.fecha_fin >= NOW() AND p.estado = 1
        ORDER BY p.fecha_inicio ASC
    `;
    db.query(sql, [negocioId], callback);
};

export const createPromocion = (data, callback) => {
    const { inventario_id, negocio_id, tipo, valor, titulo_promo, fecha_inicio, fecha_fin } = data;
    const sql = `
        INSERT INTO promociones (inventario_id, negocio_id, tipo, valor, titulo_promo, fecha_inicio, fecha_fin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [inventario_id, negocio_id, tipo, valor || null, titulo_promo, fecha_inicio, fecha_fin], (err, res) => {
        if (!err) triggerSyncUpdate(negocio_id);
        callback(err, res);
    });
};

export const deletePromocion = (id, callback) => {
    db.query('SELECT negocio_id FROM promociones WHERE id = ?', [id], (errN, rows) => {
        const nid = (!errN && rows.length > 0) ? rows[0].negocio_id : null;
        const sql = 'DELETE FROM promociones WHERE id = ?';
        db.query(sql, [id], (err, res) => {
            if (!err && nid) triggerSyncUpdate(nid);
            callback(err, res);
        });
    });
};

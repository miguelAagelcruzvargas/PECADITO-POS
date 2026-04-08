import db from './src/db.js';

const addColumnIfMissing = (columnName, alterSql) => new Promise((resolve, reject) => {
  db.query(`SHOW COLUMNS FROM turnos LIKE '${columnName}'`, (err, rows) => {
    if (err) return reject(err);
    if (rows && rows.length > 0) return resolve(false);
    db.query(alterSql, (alterErr) => {
      if (alterErr) return reject(alterErr);
      return resolve(true);
    });
  });
});

(async () => {
  try {
    const c1 = await addColumnIfMissing('monto_real_admin', 'ALTER TABLE turnos ADD COLUMN monto_real_admin DECIMAL(10,2) NULL');
    const c2 = await addColumnIfMissing('ajuste_admin_nota', 'ALTER TABLE turnos ADD COLUMN ajuste_admin_nota VARCHAR(500) NULL');
    const c3 = await addColumnIfMissing('ajuste_admin_usuario_id', 'ALTER TABLE turnos ADD COLUMN ajuste_admin_usuario_id INT NULL');
    const c4 = await addColumnIfMissing('ajuste_admin_at', 'ALTER TABLE turnos ADD COLUMN ajuste_admin_at DATETIME NULL');

    console.log('migracion_turnos_ajuste_admin:', {
      monto_real_admin: c1 ? 'creada' : 'ya_existia',
      ajuste_admin_nota: c2 ? 'creada' : 'ya_existia',
      ajuste_admin_usuario_id: c3 ? 'creada' : 'ya_existia',
      ajuste_admin_at: c4 ? 'creada' : 'ya_existia',
    });
  } catch (e) {
    console.error('Error en migracion_turnos_ajuste_admin:', e.message);
  } finally {
    db.end();
  }
})();

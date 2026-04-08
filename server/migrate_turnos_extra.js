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
    const createdMin = await addColumnIfMissing(
      'minutos_extra_autorizados',
      'ALTER TABLE turnos ADD COLUMN minutos_extra_autorizados INT DEFAULT 0'
    );

    const createdNum = await addColumnIfMissing(
      'num_extensiones',
      'ALTER TABLE turnos ADD COLUMN num_extensiones INT DEFAULT 0'
    );

    console.log('migracion_turnos_extra:', {
      minutos_extra_autorizados: createdMin ? 'creada' : 'ya_existia',
      num_extensiones: createdNum ? 'creada' : 'ya_existia'
    });
  } catch (e) {
    console.error('Error en migracion_turnos_extra:', e.message);
  } finally {
    db.end();
  }
})();

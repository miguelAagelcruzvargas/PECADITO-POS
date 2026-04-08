import db from './src/db.js';

db.query("SHOW COLUMNS FROM usuarios LIKE 'is_super_admin'", (e, r) => {
  if (r && r.length > 0) {
    console.log('Columna ya existe, solo marcando super admin...');
    marcarSuperAdmin();
  } else {
    db.query('ALTER TABLE usuarios ADD COLUMN is_super_admin TINYINT(1) DEFAULT 0', (e2) => {
      if (e2) { console.error('ALTER:', e2.message); db.end(); return; }
      console.log('Columna is_super_admin creada OK');
      marcarSuperAdmin();
    });
  }
});

function marcarSuperAdmin() {
  db.query('UPDATE usuarios SET is_super_admin = 1 ORDER BY id ASC LIMIT 1', (e, r) => {
    if (e) { console.error('UPDATE:', e.message); db.end(); return; }
    console.log('Super admin marcado, filas afectadas:', r.affectedRows);
    db.query('SELECT id, nombre, email, is_super_admin FROM usuarios', (e2, r2) => {
      console.log('Usuarios:', JSON.stringify(r2, null, 2));
      db.end();
    });
  });
}

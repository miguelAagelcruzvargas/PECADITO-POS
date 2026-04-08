const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'elenapos',
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar:', err);
    process.exit(1);
  }
  db.query("SHOW COLUMNS FROM negocios LIKE 'last_update'", (err, rows) => {
    if (err) {
      console.error('Error querying:', err);
    } else {
      console.log('Update column status:', rows.length > 0 ? 'EXISTE' : 'NO EXISTE');
    }
    db.end();
  });
});

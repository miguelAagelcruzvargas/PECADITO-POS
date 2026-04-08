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
    process.exit(1);
  }
  db.query("SHOW COLUMNS FROM negocios LIKE 'last_update'", (err, rows) => {
    if (err) {
      console.error('Error querying:', err);
      db.end();
    } else if (rows.length === 0) {
      console.log('Column missing, adding it...');
      db.query("ALTER TABLE negocios ADD COLUMN last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP", (err) => {
        if (err) console.error('Error adding column:', err);
        else console.log('Column added successfully');
        db.end();
      });
    } else {
      console.log('Update column status: EXISTE');
      db.end();
    }
  });
});

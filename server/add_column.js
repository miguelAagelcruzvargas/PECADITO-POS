import mysql from 'mysql2';

const db = mysql.createConnection({host:'localhost',user:'root',password:'',database:'elenapos'});

db.connect();
db.query('SHOW COLUMNS FROM usuarios LIKE "must_change_password"', (e, r) => {
  if (r && r.length > 0) {
    console.log('Columna must_change_password ya existe');
    db.end();
  } else {
    db.query('ALTER TABLE usuarios ADD COLUMN must_change_password TINYINT(1) DEFAULT 0', (e2) => {
      console.log(e2 ? 'Error: ' + e2.message : 'Columna must_change_password agregada');
      db.end();
    });
  }
});

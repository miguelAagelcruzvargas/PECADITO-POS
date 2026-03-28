import mysql from 'mysql2';

const db = mysql.createConnection({host:'localhost',user:'root',password:'',database:'elenapos'});

db.connect();
db.query('SELECT id, nombre, email, must_change_password FROM usuarios WHERE role = "Administrador"', (e, r) => {
  if (e) {
    console.error(e);
  } else {
    console.log(r);
  }
  db.end();
});

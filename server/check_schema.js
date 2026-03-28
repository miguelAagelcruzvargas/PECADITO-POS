import mysql from 'mysql2';
const db = mysql.createConnection({host:'localhost',user:'root',password:'',database:'elenapos'});
db.query("DESCRIBE ventas", (e1, r1) => {
  console.log("--- VENTAS ---");
  console.log(r1.map(c => c.Field));
  db.query("DESCRIBE inventario", (e2, r2) => {
    console.log("--- INVENTARIO ---");
    console.log(r2.map(c => c.Field));
    db.end();
  });
});

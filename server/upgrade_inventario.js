import mysql from 'mysql2';
const db = mysql.createConnection({host:'localhost',user:'root',password:'',database:'elenapos'});

db.query("ALTER TABLE inventario ADD COLUMN mostrar_en_menu BOOLEAN DEFAULT 0", (err) => {
  if (err) {
    if (err.errno === 1060) {
      console.log("La columna ya existe.");
    } else {
      console.log("Error:", err.message);
    }
  } else {
    console.log("Columna 'mostrar_en_menu' añadida con éxito.");
  }
  db.end();
});

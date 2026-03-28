import mysql from 'mysql2';
import bcrypt from 'bcryptjs';

const db = mysql.createConnection({host:'localhost',user:'root',password:'',database:'elenapos'});

async function run() {
  const hash = await bcrypt.hash('12345678', 10);
  
  // Actualizamos el admin actual a las nuevas credenciales generales
  db.query(
    "UPDATE usuarios SET email = 'admin@pecadito.com', contraseña = ?, must_change_password = 1 WHERE role = 'Administrador' AND negocios_id IS NULL", 
    [hash], 
    (err, result) => {
      if (err) {
        console.log("Error:", err.message);
      } else if (result.affectedRows === 0) {
        // Si no había, lo creamos
        db.query(
          "INSERT INTO usuarios (nombre, email, role, contraseña, must_change_password, permisos) VALUES ('Administrador Jefe', 'admin@pecadito.com', 'Administrador', ?, 1, '[]')",
          [hash],
          (e2) => console.log(e2 ? e2.message : "Usuario creado: admin@pecadito.com")
        );
      } else {
        console.log("Usuario actualizado: admin@pecadito.com");
      }
      db.end();
    }
  );
}

run();

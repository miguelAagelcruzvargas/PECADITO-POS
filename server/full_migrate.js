import mysql from 'mysql2';
import fs from 'fs';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  multipleStatements: true
});

connection.connect(async (err) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('Creando base de datos elenapos...');
  connection.query('CREATE DATABASE IF NOT EXISTS elenapos;', (err) => {
    if (err) {
      console.error('Error al crear DB:', err);
      process.exit(1);
    }
    
    connection.changeUser({database: 'elenapos'}, (err) => {
        if (err) {
            console.error('Error al cambiar a elenapos:', err);
            process.exit(1);
        }
        
        console.log('Importando elenapos.sql...');
        const baseSql = fs.readFileSync('c:/Users/MQerKAcademy/Desktop/multi-pos-main/elenapos.sql', 'utf8');
        connection.query(baseSql, (err) => {
            if (err) {
                console.error('Error importando base:', err);
                // Si ya existe, seguimos
            }
            
            console.log('Aplicando migraciones migration_v1.sql...');
            const migrationSql = fs.readFileSync('c:/Users/MQerKAcademy/Desktop/multi-pos-main/migration_v1.sql', 'utf8');
            connection.query(migrationSql, (err) => {
                if (err) {
                    console.error('Error en migración:', err);
                } else {
                    console.log('Todo listo! Base de datos inicializada y actualizada.');
                }
                connection.end();
            });
        });
    });
  });
});

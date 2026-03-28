import mysql from 'mysql2';
import fs from 'fs';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'elenapos',
  multipleStatements: true
});

const sql = fs.readFileSync('c:/Users/MQerKAcademy/Desktop/multi-pos-main/migration_v1.sql', 'utf8');

connection.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    process.exit(1);
  }
  console.log('Migrando base de datos (elenapos)...');
  
  connection.query(sql, (error, results) => {
    if (error) {
      console.error('Error ejecutando migración:', error);
      connection.end();
      process.exit(1);
    }
    console.log('Migración completada con éxito.');
    connection.end();
  });
});

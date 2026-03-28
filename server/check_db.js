import mysql from 'mysql2';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ''
});

connection.connect((err) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  connection.query('SHOW DATABASES', (err, results) => {
    if (results) console.log(results);
    connection.end();
  });
});

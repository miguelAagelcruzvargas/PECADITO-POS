
import db from './src/db.js';
db.query("SELECT id, nombre, nombre_comercial FROM negocios", (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
});


import db from './src/db.js';
db.query("SHOW TABLES", (err, rows) => {
    console.log("TABLES:", rows);
    db.query("SELECT * FROM negocios", (err2, rows2) => {
        console.log("NEGOCIOS:", rows2);
        process.exit();
    });
});

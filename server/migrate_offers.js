import mysql from 'mysql2/promise';

const run = async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'elenapos'
  });

  try {
    console.log("🛠️ Inyectando potencia comercial a la base de datos...");
    
    // Verificamos si ya existen los campos necesarios para ofertas
    const [offerCol] = await connection.execute("SHOW COLUMNS FROM inventario LIKE 'es_oferta'");
    if (offerCol.length === 0) {
      await connection.execute("ALTER TABLE inventario ADD COLUMN es_oferta TINYINT(1) DEFAULT 0");
      console.log("✅ Campo 'es_oferta' habilitado.");
    }

    const [priceCol] = await connection.execute("SHOW COLUMNS FROM inventario LIKE 'precio_anterior'");
    if (priceCol.length === 0) {
      await connection.execute("ALTER TABLE inventario ADD COLUMN precio_anterior DECIMAL(10,2) DEFAULT NULL");
      console.log("✅ Campo 'precio_anterior' habilitado (para tachar precios).");
    }

    console.log("🏁 Tu base de datos ya está lista para las ofertas.");

  } catch (err) {
    console.error("❌ Error en la expansión comercial:", err.message);
  } finally {
    await connection.end();
  }
};

run();

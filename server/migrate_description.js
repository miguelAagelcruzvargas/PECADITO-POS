import mysql from 'mysql2/promise';

const run = async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'elenapos'
  });

  try {
    console.log("🛠️ Verificando estructura de la base de datos...");
    
    const [columns] = await connection.execute("SHOW COLUMNS FROM inventario LIKE 'descripcion'");
    
    if (columns.length === 0) {
      await connection.execute("ALTER TABLE inventario ADD COLUMN descripcion TEXT");
      console.log("✅ Columna 'descripcion' añadida a la tabla inventario.");
    } else {
      console.log("ℹ️ La columna 'descripcion' ya existe.");
    }

    // Aprovechamos para asegurar que 'destacado' existe (por si las moscas)
    const [featuredCol] = await connection.execute("SHOW COLUMNS FROM inventario LIKE 'destacado'");
    if (featuredCol.length === 0) {
      await connection.execute("ALTER TABLE inventario ADD COLUMN destacado TINYINT(1) DEFAULT 0");
      console.log("✅ Columna 'destacado' añadida.");
    }

  } catch (err) {
    console.error("❌ Error en la migración:", err.message);
  } finally {
    await connection.end();
    console.log("🏁 Proceso de base de datos finalizado.");
  }
};

run();

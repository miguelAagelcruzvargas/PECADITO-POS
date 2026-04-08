import mysql from 'mysql2/promise';

const run = async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'elenapos'
  });

  try {
    console.log("🛠️ Creando el Centro de Inteligencia de Promociones...");
    
    // Crear tabla de promociones programables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS promociones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventario_id INT NOT NULL,
        negocio_id INT NOT NULL,
        tipo ENUM('porcentaje', 'precio_fijo', '2x1', 'personalizado') DEFAULT 'porcentaje',
        valor DECIMAL(10,2) DEFAULT NULL,
        titulo_promo VARCHAR(100) DEFAULT '¡Oferta Especial!',
        fecha_inicio DATETIME NOT NULL,
        fecha_fin DATETIME NOT NULL,
        estado TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inventario_id) REFERENCES inventario(id) ON DELETE CASCADE
      )
    `);

    console.log("✅ Tabla 'promociones' creada con soporte para programación de fechas.");

  } catch (err) {
    console.error("❌ Error en la creación del sistema de promoción:", err.message);
  } finally {
    await connection.end();
  }
};

run();

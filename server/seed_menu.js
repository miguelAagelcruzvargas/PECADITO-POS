import mysql from 'mysql2/promise';

const seed = async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'elenapos'
  });

  // ID del negocio sacado de tu captura (localhost:5000/menu/19)
  const negocioId = 19; 

  console.log("🚀 Iniciando carga de menú Pecadito...");

  const productos = [
    // Tradicionales
    ['/public/fresas_chica.png', 'Fresas con Crema Tradicional', 'Chica', 'Interno', 55, 100, 'Tradicional', 1, negocioId],
    ['/public/fresas_mediana.png', 'Fresas con Crema Tradicional', 'Mediana', 'Interno', 85, 100, 'Tradicional', 1, negocioId],
    ['/public/fresas_grande.png', 'Fresas con Crema Tradicional', 'Grande', 'Interno', 120, 100, 'Tradicional', 1, negocioId],
    ['/public/fresas_litro.png', 'Fresas con Crema Tradicional', 'Litro', 'Interno', 280, 100, 'Tradicional', 1, negocioId],
    
    // Postres
    ['/public/crepa.png', 'Crepa Dulce', 'Unitario', 'Interno', 50, 100, 'Postres', 1, negocioId],
    ['/public/hotcakes_10.png', 'Mini Hotcakes (10 piezas)', '10 pzas', 'Interno', 35, 100, 'Postres', 1, negocioId],
    ['/public/hotcakes_25.png', 'Mini Hotcakes (25 piezas)', '25 pzas', 'Interno', 60, 100, 'Postres', 1, negocioId],
    ['/public/waffle.png', 'Waffle Dulce', 'Unitario', 'Interno', 50, 100, 'Postres', 1, negocioId],
    ['/public/donitas.png', 'Mini Donitas (7 pzas)', '7 pzas', 'Interno', 50, 100, 'Postres', 1, negocioId],
    
    // Bebidas
    ['/public/frappe_basico.png', 'Frappe Básico', 'Vaso', 'Interno', 60, 100, 'Bebidas', 1, negocioId],
    ['/public/frappe_especial.png', 'Frappe Especial (Gancito/Magnum)', 'Vaso', 'Interno', 95, 100, 'Bebidas', 1, negocioId],
  ];

  const toppings = [
    ['Huevo Kinder', 35, negocioId],
    ['Ferrero Rocher', 15, negocioId],
    ['Kit Kat', 30, negocioId],
    ['Snickers', 25, negocioId],
    ['Kinder Delice', 30, negocioId],
    ['Magnum', 35, negocioId],
    ['Baileys (Extra)', 10, negocioId],
    ['Mordisco', 25, negocioId],
    ['Milky Way', 25, negocioId],
    ['Turín', 15, negocioId],
    ['Nutella (Extra)', 10, negocioId],
    ['Queso Philadelphia', 10, negocioId]
  ];

  try {
    // Insertar Productos
    for (const p of productos) {
      await connection.execute(
        'INSERT INTO inventario (imagen, producto, presentacion, proveedor, precio, stock, categoria, mostrar_en_menu, negocio_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }
    console.log("✅ Productos cargados correctamente.");

    // Insertar Toppings
    for (const t of toppings) {
      await connection.execute(
        'INSERT INTO toppings (nombre, precio, negocio_id) VALUES (?, ?, ?)',
        t
      );
    }
    console.log("✅ Toppings cargados correctamente.");

  } catch (error) {
    console.error("❌ Error al sembrar datos:", error.message);
  } finally {
    await connection.end();
    console.log("🏁 Proceso terminado.");
  }
};

seed();

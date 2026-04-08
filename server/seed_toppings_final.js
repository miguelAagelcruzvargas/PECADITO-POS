
import db from './src/db.js';

const negocioId = 19;
const categorias = [
    'LÍQUIDOS', 
    'SEMILLAS', 
    'GALLETAS', 
    'PASTELITOS', 
    'CASEROS', 
    'CEREALES', 
    'DULCES'
];

const toppingsData = [
  // LÍQUIDOS
  { nombre: 'Nutella', categoria: 'LÍQUIDOS', precio: 15 },
  { nombre: 'Cajeta', categoria: 'LÍQUIDOS', precio: 10 },
  { nombre: 'Lechera', categoria: 'LÍQUIDOS', precio: 10 },
  { nombre: 'Hershey', categoria: 'LÍQUIDOS', precio: 10 },
  { nombre: 'Jarabe Fresa', categoria: 'LÍQUIDOS', precio: 10 },

  // SEMILLAS
  { nombre: 'Granola', categoria: 'SEMILLAS', precio: 10 },
  { nombre: 'Granola premium', categoria: 'SEMILLAS', precio: 15 },
  { nombre: 'Coco rallado', categoria: 'SEMILLAS', precio: 10 },
  { nombre: 'Almendra', categoria: 'SEMILLAS', precio: 15 },
  { nombre: 'Nuez', categoria: 'SEMILLAS', precio: 15 },
  { nombre: 'Arándanos', categoria: 'SEMILLAS', precio: 10 },
  { nombre: 'Cacahuate', categoria: 'SEMILLAS', precio: 10 },
  { nombre: 'Chía', categoria: 'SEMILLAS', precio: 10 },
  { nombre: 'Amaranto', categoria: 'SEMILLAS', precio: 10 },

  // GALLETAS
  { nombre: 'Chavalín', categoria: 'GALLETAS', precio: 10 },
  { nombre: 'Oreo', categoria: 'GALLETAS', precio: 10 },
  { nombre: 'Cremax', categoria: 'GALLETAS', precio: 10 },
  { nombre: 'Canelitas', categoria: 'GALLETAS', precio: 10 },
  { nombre: 'Triki trakes', categoria: 'GALLETAS', precio: 10 },
  { nombre: 'Mini maría', categoria: 'GALLETAS', precio: 10 },
  { nombre: 'Príncipe limón', categoria: 'GALLETAS', precio: 10 },
  { nombre: 'Príncipe chocolate', categoria: 'GALLETAS', precio: 10 },

  // PASTELITOS
  { nombre: 'Gansito', categoria: 'PASTELITOS', precio: 15 },
  { nombre: 'Chocorrol', categoria: 'PASTELITOS', precio: 15 },
  { nombre: 'Pingüino', categoria: 'PASTELITOS', precio: 15 },

  // CASEROS
  { nombre: 'Pay de queso', categoria: 'CASEROS', precio: 15 },
  { nombre: 'Miniflan', categoria: 'CASEROS', precio: 15 },
  { nombre: 'Brownie', categoria: 'CASEROS', precio: 15 },

  // CEREALES
  { nombre: 'Zucaritas', categoria: 'CEREALES', precio: 10 },
  { nombre: 'Chococrispi', categoria: 'CEREALES', precio: 10 },
  { nombre: 'Froot loops', categoria: 'CEREALES', precio: 10 },
  { nombre: 'Trix / Cookie', categoria: 'CEREALES', precio: 10 },

  // DULCES
  { nombre: 'Mini kiss', categoria: 'DULCES', precio: 10 },
  { nombre: 'Lunetas chocolate', categoria: 'DULCES', precio: 10 },
  { nombre: 'Panditas', categoria: 'DULCES', precio: 10 },
  { nombre: 'Chocoretas', categoria: 'DULCES', precio: 10 },
  { nombre: 'Mazapán', categoria: 'DULCES', precio: 10 },
  { nombre: 'Bombones', categoria: 'DULCES', precio: 10 },
  { nombre: 'Bombón chocolate', categoria: 'DULCES', precio: 10 },
  { nombre: 'Murbonne (M&M)', categoria: 'DULCES', precio: 15 },
  { nombre: 'Mamut', categoria: 'DULCES', precio: 10 },
  { nombre: 'Bocadín', categoria: 'DULCES', precio: 10 },
  { nombre: 'Bubulubu', categoria: 'DULCES', precio: 15 },
  { nombre: 'Kranky', categoria: 'DULCES', precio: 10 },
  { nombre: 'Oblea', categoria: 'DULCES', precio: 10 },
  { nombre: 'Carlos V', categoria: 'DULCES', precio: 15 },
  { nombre: 'Lunetas yogurt', categoria: 'DULCES', precio: 10 },
  { nombre: 'Nido', categoria: 'DULCES', precio: 10 }
];

async function seed() {
  console.log(`--- Iniciando Carga para Negocio ID: ${negocioId} ---`);

  try {
    // 1. Crear/Asegurar categorías
    const catIds = {};
    for (const cat of categorias) {
      await new Promise((resolve, reject) => {
        db.query('INSERT IGNORE INTO toppings_categorias (nombre, negocio_id) VALUES (?, ?)', [cat, negocioId], (err) => {
          if (err) return reject(err);
          db.query('SELECT id FROM toppings_categorias WHERE nombre = ? AND negocio_id = ?', [cat, negocioId], (err2, rows) => {
            if (err2) return reject(err2);
            catIds[cat] = rows[0].id;
            console.log(`✓ Categoría ${cat} (ID: ${rows[0].id}) lista.`);
            resolve();
          });
        });
      });
    }

    // 2. Insertar Toppings
    for (const t of toppingsData) {
      await new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO toppings (nombre, precio, categoria_id, negocio_id, activo) 
           VALUES (?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE precio = VALUES(precio), categoria_id = VALUES(categoria_id), activo = 1`,
          [t.nombre, t.precio, catIds[t.categoria], negocioId],
          (err) => {
            if (err) {
              console.error(`Error al insertar ${t.nombre}:`, err);
              resolve(); // Continuar con el siguiente
            } else {
              console.log(`✓ ${t.nombre} clasificado en ${t.categoria}`);
              resolve();
            }
          }
        );
      });
    }

    console.log("--- CARGA FINALIZADA CON ÉXITO ---");
    setTimeout(() => process.exit(0), 1000);

  } catch (error) {
    console.error("Error fatal en el seed:", error);
    process.exit(1);
  }
}

seed();

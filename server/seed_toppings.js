
import db from './src/db.js';

const categorias = ['LIQUIDOS', 'TOPPINGS'];

const toppingsData = [
  // LIQUIDOS
  { nombre: 'Lechera', categoria: 'LIQUIDOS', precio: 10 },
  { nombre: 'Nutella', categoria: 'LIQUIDOS', precio: 15 },
  { nombre: 'Cajeta', categoria: 'LIQUIDOS', precio: 10 },
  { nombre: 'Hershey\'s', categoria: 'LIQUIDOS', precio: 10 },
  { nombre: 'Jarabe de fresa', categoria: 'LIQUIDOS', precio: 10 },
  
  // TOPPINGS SÓLIDOS
  { nombre: 'Pay de queso', categoria: 'TOPPINGS', precio: 15 },
  { nombre: 'Brownie', categoria: 'TOPPINGS', precio: 15 },
  { nombre: 'Miniflan', categoria: 'TOPPINGS', precio: 15 },
  { nombre: 'Mini kiss', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Lunetas', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Gomitas', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Chocoretas', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Mazapán', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Bombones', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Muibon', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Mamut', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Chavalin', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Pingüino', categoria: 'TOPPINGS', precio: 15 },
  { nombre: 'Zucaritas', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Chococrispi', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Froot loops', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Cremax', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Trikitrakes', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Mini marías', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Canelitas', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Trix', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Bocadin', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Granola premium', categoria: 'TOPPINGS', precio: 15 },
  { nombre: 'Bubulubu', categoria: 'TOPPINGS', precio: 15 },
  { nombre: 'Gancito', categoria: 'TOPPINGS', precio: 15 },
  { nombre: 'Coco rallado', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Almendra', categoria: 'TOPPINGS', precio: 15 },
  { nombre: 'Oreo', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Granola', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Nuez', categoria: 'TOPPINGS', precio: 15 },
  { nombre: 'Oblea', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Nido', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Carlos V', categoria: 'TOPPINGS', precio: 15 },
  { nombre: 'Arandanos', categoria: 'TOPPINGS', precio: 10 },
  { nombre: 'Cacahuate', categoria: 'TOPPINGS', precio: 10 }
];

async function seed() {
  console.log('--- Iniciando Carga Correcta de Toppings ---');
  
  // 1. Obtener el ID del negocio Tuxtepec
  const negocioId = await new Promise((resolve) => {
    db.query("SELECT id FROM negocios WHERE nombre_comercial LIKE '%Tuxtepec%' LIMIT 1", (err, rows) => {
        resolve(rows && rows.length > 0 ? rows[0].id : null);
    });
  });

  if (!negocioId) {
    console.error("No se encontró el negocio Tuxtepec.");
    return;
  }
  
  console.log(`Negocio ID detectado: ${negocioId}`);

  // 2. Crear/Asegurar categorías asociadas al negocio
  for (const cat of categorias) {
    await new Promise((resolve) => {
      db.query('INSERT IGNORE INTO toppings_categorias (nombre, negocio_id) VALUES (?, ?)', [cat, negocioId], resolve);
    });
  }

  // 3. Insertar Toppings con el negocio_id y categoria_id correctos
  for (const t of toppingsData) {
    db.query(
      `INSERT INTO toppings (nombre, precio, categoria_id, negocio_id) 
       SELECT ?, ?, id, ? FROM toppings_categorias WHERE nombre = ? AND negocio_id = ?
       ON DUPLICATE KEY UPDATE precio = VALUES(precio)`,
      [t.nombre, t.precio, negocioId, t.categoria, negocioId],
      (err) => {
        if (err) console.error(`Error al insertar ${t.nombre}:`, err);
        else console.log(`✓ ${t.nombre} (${t.categoria}) cargado.`);
      }
    );
  }
}

seed();

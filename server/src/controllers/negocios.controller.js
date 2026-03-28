import * as Negocios from "../models/negocios.model.js";
import db from "../db.js";

const normalizeLogoPath = (logoPath) => {
  if (!logoPath || typeof logoPath !== "string") return logoPath;
  return logoPath.startsWith("/uploads/") ? logoPath.replace("/uploads/", "/public/") : logoPath;
};

// Crear un nuevo negocio
export const crear = async (req, res) => {
  const { nombre, ubicacion, tipo, rfc, eslogan } = req.body;
  const logo = req.file ? `/public/${req.file.filename}` : null;

  try {
    if (!nombre) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    const negocio = { nombre, ubicacion, tipo, rfc, eslogan, logo };

    Negocios.createNegocio(negocio, (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Error al crear el negocio", error });
      }

      res.status(201).json({ negocio });
    });

  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};

// Obtener todos los negocios
export const obtener = async (req, res) => {
  try {
    Negocios.ObtenerNegocios((error, results) => {
      if (error) {
        console.error("Error al obtener negocios:", error);
        return res.status(500).json({ message: "Error al obtener los negocios", error });
      }

      const negociosNormalizados = Array.isArray(results)
        ? results.map((negocio) => ({ ...negocio, logo: normalizeLogoPath(negocio.logo) }))
        : [];

      res.status(200).json({ data: negociosNormalizados });
    });
  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};

// Obtener uno por ID
export const obtenerUno = (req, res) => {
  const { id } = req.params;
  Negocios.getNegocioById(id, (error, result) => {
    if (error) return res.status(500).json({ message: "Error al obtener el negocio", error });
    if (result.length === 0) return res.status(404).json({ message: "Negocio no encontrado" });
    const negocio = { ...result[0], logo: normalizeLogoPath(result[0].logo) };
    res.status(200).json({ data: negocio });
  });
};

// Actualizar un negocio
export const actualizar = (req, res) => {
  const { id } = req.params;
  const { nombre, ubicacion, tipo, rfc, eslogan } = req.body;
  
  // Si hay un archivo nuevo, lo usamos, si no mantenemos el anterior (metadata o nulo)
  const logo = req.file ? `/public/${req.file.filename}` : normalizeLogoPath(req.body.logo);

  if (!nombre) {
    return res.status(400).json({ message: "El nombre es obligatorio" });
  }

  const data = { nombre, ubicacion, tipo, rfc, eslogan, logo };

  Negocios.updateNegocio(id, data, (error, result) => {
    if (error) return res.status(500).json({ message: "Error al actualizar el negocio", error });
    res.status(200).json({ message: "Negocio actualizado correctamente", logo: normalizeLogoPath(logo) });
  });
};

// Eliminar un negocio 
export const eliminar = (req, res) => {
  const { id } = req.params;
  const negocioId = Number(id);
  if (isNaN(negocioId)) return res.status(400).json({ message: 'ID inválido' });

  db.beginTransaction(errTx => {
    if (errTx) return res.status(500).json({ message: 'No se pudo iniciar transacción', errTx });

    const summary = {};
    const exec = (sql, params, key, next) => {
      db.query(sql, params, (err, result) => {
        if (err) return db.rollback(() => res.status(500).json({ message: 'Error en eliminación relacionada', step: key, error: err }));
        summary[key] = result.affectedRows;
        next();
      });
    };

    const steps = [
      // detalle_venta depende de ventas e inventario, pero tiene id_negocio directo
      (n) => exec('DELETE FROM detalle_venta WHERE id_negocio = ?', [negocioId], 'detalle_venta', n),
      (n) => exec('DELETE FROM ventas WHERE id_negocio = ?', [negocioId], 'ventas', n),
      (n) => exec('DELETE FROM inventario WHERE negocio_id = ?', [negocioId], 'inventario', n),
      (n) => exec('DELETE FROM pedidos WHERE negocio_id = ?', [negocioId], 'pedidos', n),
      (n) => exec('DELETE FROM gastos WHERE id_negocio = ?', [negocioId], 'gastos', n),
      (n) => exec('DELETE FROM clientes WHERE negocio_id = ?', [negocioId], 'clientes', n),
      (n) => exec('DELETE FROM proveedores WHERE id_negocio = ?', [negocioId], 'proveedores', n),
      (n) => exec('DELETE FROM usuarios WHERE negocios_id = ?', [negocioId], 'usuarios', n),
      (n) => exec('DELETE FROM negocios WHERE id = ?', [negocioId], 'negocios', n)
    ];

    let idx = 0;
    const run = () => {
      if (idx >= steps.length) {
        return db.commit(errCommit => {
          if (errCommit) return db.rollback(() => res.status(500).json({ message: 'Error al confirmar transacción', errCommit }));
          res.status(200).json({ message: 'Negocio y datos relacionados eliminados', summary });
        });
      }
      steps[idx++](run);
    };
    run();
  });
};
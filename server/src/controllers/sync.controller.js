import db from "../db.js";

export const getSyncToken = (req, res) => {
  const { id } = req.params;
  console.log(`>>> Chequeo de Sync Token solicitado para negocio ID: ${id}`);
  db.query('SELECT last_update FROM negocios WHERE id = ?', [id], (err, rows) => {
    if (err) {
      console.error('>>> Error en consulta sync-token:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (rows.length === 0) return res.status(404).json({ message: "Negocio no encontrado" });
    res.json({ last_update: rows[0].last_update });
  });
};

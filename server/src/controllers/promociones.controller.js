import * as Promociones from "../models/promociones.model.js";

export const getPromociones = (req, res) => {
    const { negocioId } = req.params;
    Promociones.getPromocionesByNegocio(negocioId, (error, results) => {
        if (error) {
            console.error("Error al obtener promociones:", error);
            return res.status(500).json({ message: "Error al obtener las promociones", error });
        }
        res.status(200).json(results || []);
    });
};

export const crearPromocion = (req, res) => {
    const data = req.body;
    Promociones.createPromocion(data, (error, result) => {
        if (error) {
            console.error("Error al crear promoción:", error);
            return res.status(500).json({ message: "Error al crear la promoción", error });
        }
        res.status(201).json({ id: result.insertId });
    });
};

export const eliminarPromocion = (req, res) => {
    const { id } = req.params;
    Promociones.deletePromocion(id, (error, result) => {
        if (error) {
            console.error("Error al eliminar promoción:", error);
            return res.status(500).json({ message: "Error al eliminar la promoción", error });
        }
        res.status(200).json({ message: "Promoción eliminada satisfactoriamente" });
    });
};

import * as Usuarios from "../models/users.model.js";
import bcrypt from "bcryptjs";
import { createAccessToken } from "../libs/jwt.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

// Crear un nuevo usuario
export const crear = async (req, res) => {
  const { nombre, email, role, contraseña, negocios_id } = req.body;

  try {
    if (!nombre || !email || !role || !contraseña) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const hash = await bcrypt.hash(contraseña, 10);

    const usuario = { nombre, email, role, contraseña: hash, negocios_id, must_change_password: 1 };

    Usuarios.createUsuario(usuario, (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Error al crear el usuario", error });
      }

      // Verifica si el modelo respondió que ya existe
      if (result.existe) {
        return res.status(409).json({ message: "El usuario ya está registrado" });
      }

      res.status(201).json({ 
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role,
       });
    });

  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};

// Obtener todos los usuarios
export const obtener = async (req, res) => {
  try {
    Usuarios.ObtenerUsuarios((error, results) => {
      if (error) {
        return res.status(500).json({ message: "Error al obtener los usuarios", error });
      }

      res.status(200).json({ data: results });
    });
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};

// Obtener uno por relacion
export const obtenerValoresid = (req, res) => {
  const { id } = req.params;
  Usuarios.getValoresById(id, (err, result) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error al obtener el valor' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'valor no encontrado' });
    }

    res.json(result);
  });
};

// Obtener uno por ID
export const obtenerUno = (req, res) => {
  const { id } = req.params;
  Usuarios.getUsuarioById(id, (error, result) => {
    if (error) return res.status(500).json({ message: "Error al obtener el usuario", error });
    if (result.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
    res.status(200).json({ data: result[0] });
  });
};

// Actualizar un usuario
export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { contraseña } = req.body;

    if (!contraseña) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

      const hash = await bcrypt.hash(contraseña, 10);

      const data = {contraseña: hash, must_change_password: req.body.must_change_password}

    Usuarios.updateUsuario(id, data, (error, result) => {
      if (error) return res.status(500).json({ message: "Error al actualizar el usuario", error });
      res.status(200).json({ message: "Usuario actualizado correctamente" });
    });
  } catch (error) {
    console.log(error);
  }
};

export const actualizarPerfil = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, contraseña } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ message: "Nombre y correo son obligatorios" });
    }

    const usuarioActual = await Usuarios.getUsuarioById(id);
    if (!usuarioActual) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar que el correo no pertenezca a otro usuario.
    Usuarios.getUsuarioPorEmail(email, async (errMail, rowsMail) => {
      if (errMail) return res.status(500).json({ message: "Error validando correo", errMail });

      const existente = rowsMail?.[0];
      if (existente && Number(existente.id) !== Number(id)) {
        return res.status(409).json({ message: "Ese correo ya está en uso" });
      }

      const payload = { nombre, email };

      if (contraseña && String(contraseña).trim() !== "") {
        if (String(contraseña).length < 8) {
          return res.status(400).json({ message: "La contraseña debe tener mínimo 8 caracteres" });
        }
        payload.contraseña = await bcrypt.hash(contraseña, 10);
      }

      Usuarios.updatePerfilUsuario(id, payload, async (errorUpdate) => {
        if (errorUpdate) return res.status(500).json({ message: "Error al actualizar perfil", errorUpdate });

        const userUpdated = await Usuarios.getUsuarioById(id);
        return res.status(200).json({
          message: "Perfil actualizado",
          user: {
            id: userUpdated.id,
            nombre: userUpdated.nombre,
            email: userUpdated.email,
            role: userUpdated.role,
            negocios_id: userUpdated.negocios_id || null,
            nombre_negocio: userUpdated.nombre_negocio || null,
            permisos: userUpdated.permisos || null,
            must_change_password: userUpdated.must_change_password || false
          }
        });
      });
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
};

// Eliminar un negocio
export const eliminar = (req, res) => {
  const { id } = req.params;

  Usuarios.deleteUsuario(id, (error, result) => {
    if (error) return res.status(500).json({ message: "Error al eliminar el negocio", error });
    res.status(200);
  });
};

export const login = async (req, res) => {
  const { email, contraseña } = req.body;

  try {
    if (!email || !contraseña) {
      return res.status(400).json({ message: "Email y contraseña son obligatorios" });
    }

    Usuarios.getUsuarioPorEmail(email, async (error, results) => {
      if (error) {
        return res.status(500).json({ message: "Error al obtener el usuario", error });
      }

      const usuario = results[0];

      if (!usuario) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const isMatch = await bcrypt.compare(contraseña, usuario.contraseña);
      if (!isMatch) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }

      // Marcar al usuario como logueado
      Usuarios.marcarComoLogueado(usuario.id, (err) => {
        if (err) {
          console.error("Error al marcar como logueado:", err);
        }
      });

      const token = await createAccessToken({ id: usuario.id });

      res.cookie("token", token);

      res.json({ 
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          role: usuario.role,
          negocios_id: usuario.negocios_id || null,
          nombre_negocio: usuario.nombre_negocio || null,
          permisos: usuario.permisos || null,
          must_change_password: usuario.must_change_password || false
      });
    });
  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
}

export const logout = async (req, res) => {

  const userId = req.user?.id;

  if (!userId) {
    return res.status(400).json({ message: "Usuario no autenticado" });
  }

  // Marcar al usuario como logueado
  Usuarios.marcarComoLogout(userId, (err) => {
    if (err) {
      console.error("Error al marcar como logueado:", err);
    }
  });

  res.cookie("token", "", {
    expires: new Date(0),
  });
  
  return res.sendStatus(200);
};

export const verifyToken = async (req, res) => {
  const { token } = req.cookies;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, TOKEN_SECRET, async (err, user) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });

    const userFound = await Usuarios.getUsuarioById(user.id);
    if (!userFound) return res.status(401).json({ message: "Unauthorized" });

    return res.json({
      id: userFound.id,
      nombre: userFound.nombre,
      email: userFound.email,
      role: userFound.role,
      negocios_id: userFound.negocios_id || null,
      nombre_negocio: userFound.nombre_negocio || null,
      permisos: userFound.permisos || null,
      must_change_password: userFound.must_change_password || false
    });
  });
};

export const confirmarContraseña = async (req, res) => {
  const { email, contraseña } = req.body;

  try {
    if (!contraseña) {
      return res.status(400).json({ message: "La contraseña es obligatorios" });
    }

    Usuarios.getUsuarioPorEmail(email, async (error, results) => {
      if (error) {
        return res.status(500).json({ message: "Error al obtener el usuario", error });
      }

      const usuario = results[0];

      if (!usuario) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const isMatch = await bcrypt.compare(contraseña, usuario.contraseña);
      if (!isMatch) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }

      res.status(200).json({ message: 'Completado' });
    });
  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
  }
}
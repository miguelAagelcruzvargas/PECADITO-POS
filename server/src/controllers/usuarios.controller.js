import * as Usuarios from "../models/users.model.js";
import bcrypt from "bcryptjs";
import { createAccessToken } from "../libs/jwt.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import db from "../db.js";

// Crear un nuevo usuario
export const crear = async (req, res) => {
  const { nombre, email, role, contraseña, negocios_id, horario_entrada, horario_salida, tipo_turno } = req.body;

  try {
    if (!nombre || !email || !role || !contraseña) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const hash = await bcrypt.hash(contraseña, 10);

    const usuario = { nombre, email, role, contraseña: hash, negocios_id, must_change_password: 1, horario_entrada: horario_entrada || null, horario_salida: horario_salida || null, tipo_turno: tipo_turno || 'completo' };

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

// Crear empleado con credenciales auto-generadas
export const crearEmpleado = async (req, res) => {
  const { nombre, negocios_id, horario_entrada, horario_salida, tipo_turno } = req.body;

  try {
    if (!nombre || !negocios_id) {
      return res.status(400).json({ message: "Nombre y negocio son obligatorios" });
    }

    // Generar credenciales únicas
    const rand = Math.floor(1000 + Math.random() * 9000);
    const base = nombre.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '').substring(0, 12);
    const email = `${base}${rand}@pecadito.pos`;
    const contraseñaPlana = [...Array(8)].map(() => 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'.charAt(Math.floor(Math.random() * 54))).join('');
    const hash = await bcrypt.hash(contraseñaPlana, 10);

    const usuario = {
      nombre,
      email,
      role: 'Empleado',
      contraseña: hash,
      negocios_id,
      must_change_password: 0,
      horario_entrada: horario_entrada || null,
      horario_salida: horario_salida || null,
      tipo_turno: tipo_turno || 'completo'
    };

    Usuarios.createUsuario(usuario, (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Error al crear el empleado", error });
      }
      res.status(201).json({
        id: result.insertId,
        nombre,
        email,
        contraseña: contraseñaPlana, // Enviada solo esta vez
        role: 'Empleado',
        horario_entrada,
        horario_salida,
        tipo_turno: tipo_turno || 'completo'
      });
    });
  } catch (error) {
    console.error("Error al crear empleado:", error);
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
    const { contraseña, horario_entrada, horario_salida, tipo_turno } = req.body;
    const data = {};

    if (contraseña !== undefined && String(contraseña).trim() !== "") {
      const hash = await bcrypt.hash(contraseña, 10);
      data.contraseña = hash;
      data.must_change_password = req.body.must_change_password ?? 0;
    }

    if (horario_entrada !== undefined) data.horario_entrada = horario_entrada || null;
    if (horario_salida !== undefined) data.horario_salida = horario_salida || null;
    if (tipo_turno !== undefined) data.tipo_turno = tipo_turno || 'completo';

    if (!Object.keys(data).length) {
      return res.status(400).json({ message: "No hay campos para actualizar" });
    }

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
    const { nombre, email, contraseña, contraseñaActual } = req.body;

    if (!contraseñaActual) {
      return res.status(400).json({ message: "Debes proporcionar tu contraseña actual para confirmar los cambios." });
    }

    // Buscar al usuario en la base de datos para comparar la contraseña actual
    db.query("SELECT * FROM usuarios WHERE id = ?", [id], async (err, rows) => {
      if (err) return res.status(500).json({ message: "Error al validar identidad", err });
      const usuarioActual = rows?.[0];

      if (!usuarioActual) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // 1. Validar que la contraseña actual es la correcta
      const isMatch = await bcrypt.compare(contraseñaActual, usuarioActual.contraseña);
      if (!isMatch) {
        return res.status(401).json({ message: "La contraseña actual es incorrecta. No se pueden guardar los cambios." });
      }

      // 2. Si se cambia el email, verificar disponibilidad
      if (email && email !== usuarioActual.email) {
        const checkEmailSql = "SELECT id FROM usuarios WHERE email = ? AND id <> ?";
        const emailRows = await new Promise((resolve, reject) => {
          db.query(checkEmailSql, [email, id], (e, r) => e ? reject(e) : resolve(r));
        });

        if (emailRows.length > 0) {
          return res.status(409).json({ message: "Ese correo electrónico ya está siendo usado por otro administrador." });
        }
      }

      // 3. Preparar los datos a actualizar
      const actualizacion = { 
        nombre: nombre || usuarioActual.nombre, 
        email: email || usuarioActual.email 
      };

      if (contraseña && String(contraseña).trim() !== "") {
        if (String(contraseña).length < 8) {
          return res.status(400).json({ message: "La nueva contraseña debe tener al menos 8 caracteres para ser segura." });
        }
        actualizacion.contraseña = await bcrypt.hash(contraseña, 10);
      }

      // 4. Ejecutar la actualización
      Usuarios.updatePerfilUsuario(id, actualizacion, (errorUpdate) => {
        if (errorUpdate) return res.status(500).json({ message: "Error al actualizar perfil en la base de datos.", errorUpdate });

        res.status(200).json({
          message: "¡Perfil actualizado con éxito!",
          user: {
            id: usuarioActual.id,
            nombre: actualizacion.nombre,
            email: actualizacion.email,
            role: usuarioActual.role,
            is_super_admin: usuarioActual.is_super_admin
          }
        });
      });
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: "Error crítico del servidor", error });
  }
};

// Eliminar un negocio
export const eliminar = (req, res) => {
  const { id } = req.params;

  db.query('SELECT is_super_admin FROM usuarios WHERE id = ?', [id], (errCheck, rows) => {
    if (errCheck) return res.status(500).json({ message: 'Error al verificar usuario' });
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (rows[0].is_super_admin === 1) {
      return res.status(403).json({ message: 'No se puede eliminar al administrador principal del sistema.' });
    }

    Usuarios.deleteUsuario(id, (error) => {
      if (error) return res.status(500).json({ message: 'Error al eliminar el usuario', error });
      res.status(200).json({ message: 'Usuario eliminado' });
    });
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
          is_super_admin: usuario.is_super_admin || 0,
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
  let userId = req.user?.id;

  // En esta ruta no siempre viene req.user; intentamos obtener id desde cookie JWT.
  if (!userId && req.cookies?.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, TOKEN_SECRET);
      userId = decoded?.id;
    } catch (_e) {
      userId = null;
    }
  }

  if (userId) {
    Usuarios.marcarComoLogout(userId, (err) => {
      if (err) {
        console.error("Error al marcar como logout:", err);
      }
    });
  }

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
      is_super_admin: userFound.is_super_admin || 0,
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
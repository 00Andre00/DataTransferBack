// controllers/userController.js
const User = require('../models/User');

exports.getAll = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    console.error('❌ Error getAll users:', err.message);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error('❌ Error getById user:', err.message);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

exports.create = async (req, res) => {
  try {
    const { username, password, nombre, rol, sede_id, area_id } = req.body;

    if (!username || !password || !nombre || !rol) {
      return res.status(400).json({ error: 'username, password, nombre y rol son requeridos' });
    }
    if (!['admin', 'encargado', 'rrhh', 'area_user'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    // rrhh y area_user SIEMPRE tienen sede y área
    if ((rol === 'rrhh' || rol === 'area_user') && !sede_id) {
      return res.status(400).json({ error: 'sede_id es requerido para rrhh y area_user' });
    }
    if ((rol === 'rrhh' || rol === 'area_user') && !area_id) {
      return res.status(400).json({ error: 'area_id es requerido para rrhh y area_user' });
    }

    const existe = await User.findByUsername(username);
    if (existe) return res.status(409).json({ error: 'El username ya existe' });

    const user = await User.create({ username, password, nombre, rol, sede_id, area_id });
    res.status(201).json(user);
  } catch (err) {
    console.error('❌ Error create user:', err.message);
    res.status(500).json({ error: err.message || 'Error al crear usuario' });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { rol, sede_id, area_id } = req.body;

    // Validación según rol final
    const rolFinal = rol || user.rol;
    if ((rolFinal === 'rrhh' || rolFinal === 'area_user')) {
      const sedeFinal = sede_id !== undefined ? sede_id : user.sede_id;
      const areaFinal = area_id !== undefined ? area_id : user.area_id;
      if (!sedeFinal) return res.status(400).json({ error: 'sede_id es requerido' });
      if (!areaFinal) return res.status(400).json({ error: 'area_id es requerido' });
    }

    const updated = await User.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('❌ Error update user:', err.message);
    res.status(500).json({ error: err.message || 'Error al actualizar usuario' });
  }
};

exports.delete = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.username === 'admin') {
      return res.status(400).json({ error: 'No se puede eliminar al usuario admin principal' });
    }

    await User.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error delete user:', err.message);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await User.verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
      sede_id: user.sede_id,
      sede_nombre: user.sede_nombre,
      area_id: user.area_id,
      area_nombre: user.area_nombre
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, user: payload });
  } catch (err) {
    console.error('❌ Error login:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.verifyToken = (req, res) => {
  res.json({ valid: true, user: req.user });
};
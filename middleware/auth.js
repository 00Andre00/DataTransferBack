// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'transferencia_drtc_secret';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // ✅ Fallback: token por query string (para visor <object>/<iframe>)
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol admin' });
  }
  next();
}

function requireAdminOrEncargado(req, res, next) {
  const rol = req.user?.rol;
  if (rol !== 'admin' && rol !== 'encargado') {
    return res.status(403).json({ error: 'Se requiere rol admin o encargado' });
  }
  next();
}

function requireAdminOrRRHH(req, res, next) {
  const rol = req.user?.rol;
  if (rol !== 'admin' && rol !== 'rrhh') {
    return res.status(403).json({ error: 'Se requiere rol admin o rrhh' });
  }
  next();
}

function requireAnyRole(req, res, next) {
  const rol = req.user?.rol;
  if (!['admin', 'encargado', 'rrhh', 'area_user'].includes(rol)) {
    return res.status(403).json({ error: 'Rol no autorizado' });
  }
  next();
}

function canAccessSede(targetSedeId) {
  return (req, res, next) => {
    const { rol, sede_id: userSedeId } = req.user;
    if (rol === 'admin' || rol === 'encargado') return next();
    if ((rol === 'rrhh' || rol === 'area_user') && targetSedeId && targetSedeId !== userSedeId) {
      return res.status(403).json({ error: 'Sin acceso a esta sede' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminOrEncargado,
  requireAdminOrRRHH,
  requireAnyRole,
  canAccessSede,
  JWT_SECRET
};
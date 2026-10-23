// middleware/validation.js

function validarDNI(req, res, next) {
  const { dni } = req.body;
  if (!dni || !/^\d{8}$/.test(String(dni))) {
    return res.status(400).json({ error: 'El DNI debe tener exactamente 8 dígitos' });
  }
  next();
}

function validarWorker(req, res, next) {
  const { dni, nombre_completo, regimen_codigo, fecha_ingreso, sede_id } = req.body;

  const errors = [];
  if (!dni || !/^\d{8}$/.test(String(dni))) errors.push('DNI inválido');
  if (!nombre_completo?.trim()) errors.push('Nombre completo es requerido');
  if (!regimen_codigo) errors.push('Régimen es requerido');
  if (!fecha_ingreso) errors.push('Fecha de ingreso es requerida');
  if (!sede_id) errors.push('Sede es requerida');

  if (errors.length) {
    return res.status(400).json({ error: errors.join('. ') });
  }
  next();
}

module.exports = { validarDNI, validarWorker };
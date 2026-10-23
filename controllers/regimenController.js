// controllers/regimenController.js
const Regimen = require('../models/Regimen');

exports.getAll = async (req, res) => {
  try {
    const regimenes = await Regimen.getAll();
    res.json(regimenes);
  } catch (err) {
    console.error('❌ Error getAll regimenes:', err.message);
    res.status(500).json({ error: 'Error al obtener regímenes' });
  }
};

exports.getByCodigo = async (req, res) => {
  try {
    const r = await Regimen.getByCodigo(req.params.codigo);
    if (!r) return res.status(404).json({ error: 'Régimen no encontrado' });
    res.json(r);
  } catch (err) {
    console.error('❌ Error getByCodigo regimen:', err.message);
    res.status(500).json({ error: 'Error al obtener régimen' });
  }
};

exports.create = async (req, res) => {
  try {
    const { codigo, nombre, tiene_fecha_salida, descripcion, orden } = req.body;
    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'codigo y nombre son requeridos' });
    }

    const existe = await Regimen.getByCodigo(codigo);
    if (existe) return res.status(409).json({ error: 'Ya existe un régimen con ese código' });

    const nuevo = await Regimen.create({ codigo, nombre, tiene_fecha_salida, descripcion });
    res.status(201).json(nuevo);
  } catch (err) {
    console.error('❌ Error create regimen:', err.message);
    res.status(500).json({ error: err.message || 'Error al crear régimen' });
  }
};

exports.update = async (req, res) => {
  try {
    const existe = await Regimen.getByCodigo(req.params.codigo);
    if (!existe) return res.status(404).json({ error: 'Régimen no encontrado' });

    const updated = await Regimen.update(req.params.codigo, req.body);
    res.json(updated);
  } catch (err) {
    console.error('❌ Error update regimen:', err.message);
    res.status(500).json({ error: err.message || 'Error al actualizar régimen' });
  }
};

/**
 * Renombrar código (ej: TERCEROS -> TERCEROS_V2)
 * Gracias a FK ON UPDATE CASCADE los workers se actualizan solos
 */
exports.rename = async (req, res) => {
  try {
    const { newCodigo } = req.body;
    if (!newCodigo) return res.status(400).json({ error: 'newCodigo es requerido' });

    const existe = await Regimen.getByCodigo(newCodigo);
    if (existe) return res.status(409).json({ error: 'El nuevo código ya existe' });

    const updated = await Regimen.renameCodigo(req.params.codigo, newCodigo);
    res.json(updated);
  } catch (err) {
    console.error('❌ Error rename regimen:', err.message);
    res.status(500).json({ error: err.message || 'Error al renombrar régimen' });
  }
};

exports.checkDelete = async (req, res) => {
  try {
    const info = await Regimen.canDelete(req.params.codigo);
    res.json(info);
  } catch (err) {
    console.error('❌ Error checkDelete regimen:', err.message);
    res.status(500).json({ error: 'Error al verificar dependencias' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Regimen.delete(req.params.codigo);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error delete regimen:', err.message);
    res.status(400).json({ error: err.message });
  }
};
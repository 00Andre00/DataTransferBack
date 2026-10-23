// controllers/sedeController.js
const Sede = require('../models/Sede');

exports.getAll = async (req, res) => {
  try {
    const sedes = await Sede.getAll();
    res.json(sedes);
  } catch (err) {
    console.error('❌ Error getAll sedes:', err.message);
    res.status(500).json({ error: 'Error al obtener sedes' });
  }
};

exports.getById = async (req, res) => {
  try {
    const sede = await Sede.getById(req.params.id);
    if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });
    res.json(sede);
  } catch (err) {
    console.error('❌ Error getById sede:', err.message);
    res.status(500).json({ error: 'Error al obtener sede' });
  }
};

exports.create = async (req, res) => {
  try {
    const { id, nombre, codigo, direccion } = req.body;
    if (!id || !nombre) {
      return res.status(400).json({ error: 'id y nombre son requeridos' });
    }

    const existe = await Sede.getById(id);
    if (existe) {
      return res.status(409).json({ error: 'Ya existe una sede con ese id' });
    }

    const sede = await Sede.create({ id, nombre, codigo, direccion });
    res.status(201).json(sede);
  } catch (err) {
    console.error('❌ Error create sede:', err.message);
    res.status(500).json({ error: err.message || 'Error al crear sede' });
  }
};

exports.update = async (req, res) => {
  try {
    const sede = await Sede.getById(req.params.id);
    if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });

    const updated = await Sede.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('❌ Error update sede:', err.message);
    res.status(500).json({ error: err.message || 'Error al actualizar sede' });
  }
};

/**
 * Antes de eliminar, verifica dependencias
 */
exports.checkDelete = async (req, res) => {
  try {
    const info = await Sede.canDelete(req.params.id);
    res.json(info);
  } catch (err) {
    console.error('❌ Error checkDelete sede:', err.message);
    res.status(500).json({ error: 'Error al verificar dependencias' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Sede.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error delete sede:', err.message);
    res.status(400).json({ error: err.message });
  }
};
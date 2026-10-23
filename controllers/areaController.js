// controllers/areaController.js
const Area = require('../models/Area');

exports.getAll = async (req, res) => {
  try {
    const { sede_id } = req.query;
    const areas = await Area.getAll({ sede_id });
    res.json(areas);
  } catch (err) {
    console.error('❌ Error getAll areas:', err.message);
    res.status(500).json({ error: 'Error al obtener áreas' });
  }
};

exports.getById = async (req, res) => {
  try {
    const area = await Area.getById(req.params.id);
    if (!area) return res.status(404).json({ error: 'Área no encontrada' });
    res.json(area);
  } catch (err) {
    console.error('❌ Error getById area:', err.message);
    res.status(500).json({ error: 'Error al obtener área' });
  }
};

exports.create = async (req, res) => {
  try {
    const { sede_id, nombre } = req.body;
    if (!sede_id || !nombre) {
      return res.status(400).json({ error: 'sede_id y nombre son requeridos' });
    }

    const area = await Area.create({ sede_id, nombre });
    res.status(201).json(area);
  } catch (err) {
    console.error('❌ Error create area:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un área con ese nombre en esa sede' });
    }
    res.status(500).json({ error: err.message || 'Error al crear área' });
  }
};

exports.update = async (req, res) => {
  try {
    const area = await Area.getById(req.params.id);
    if (!area) return res.status(404).json({ error: 'Área no encontrada' });

    const updated = await Area.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('❌ Error update area:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un área con ese nombre en esa sede' });
    }
    res.status(500).json({ error: err.message || 'Error al actualizar área' });
  }
};

exports.checkDelete = async (req, res) => {
  try {
    const info = await Area.canDelete(req.params.id);
    res.json(info);
  } catch (err) {
    console.error('❌ Error checkDelete area:', err.message);
    res.status(500).json({ error: 'Error al verificar dependencias' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Area.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error delete area:', err.message);
    res.status(400).json({ error: err.message });
  }
};
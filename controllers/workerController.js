// controllers/workerController.js
const Worker = require('../models/Worker');
const { autoInactivarWorkers } = require('../utils/autoInactivar');

exports.getAll = async (req, res) => {
  try {
    // Auto-inactivar antes de devolver (por si el server estuvo apagado)
    await autoInactivarWorkers();

    const { rol, sede_id: userSede } = req.user;
    let sede_id = req.query.sede_id;
    if (rol === 'rrhh') sede_id = userSede;

    const workers = await Worker.getAll({ sede_id });
    res.json(workers);
  } catch (err) {
    console.error('❌ Error getAll workers:', err.message);
    res.status(500).json({ error: 'Error al obtener trabajadores' });
  }
};

exports.getById = async (req, res) => {
  try {
    const worker = await Worker.getById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

    const { rol, sede_id: userSede } = req.user;
    if (rol === 'rrhh' && worker.sede_id !== userSede) {
      return res.status(403).json({ error: 'Sin acceso a esta sede' });
    }

    res.json(worker);
  } catch (err) {
    console.error('❌ Error getById worker:', err.message);
    res.status(500).json({ error: 'Error al obtener trabajador' });
  }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.user.rol === 'rrhh') {
      data.sede_id = req.user.sede_id;
    }

    if (!data.sede_id) {
      return res.status(400).json({ error: 'sede_id es requerido' });
    }

    const existe = await Worker.findByDni(data.dni);
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un trabajador con ese DNI' });
    }

    const worker = await Worker.create(data);
    res.status(201).json(worker);
  } catch (err) {
    console.error('❌ Error create worker:', err.message);
    res.status(500).json({ error: err.message || 'Error al crear trabajador' });
  }
};

exports.update = async (req, res) => {
  try {
    const worker = await Worker.getById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

    const { rol, sede_id: userSede } = req.user;
    if (rol === 'rrhh' && worker.sede_id !== userSede) {
      return res.status(403).json({ error: 'Sin acceso a esta sede' });
    }

    const data = { ...req.body };
    if (rol === 'rrhh') delete data.sede_id;

    const updated = await Worker.update(req.params.id, data);
    res.json(updated);
  } catch (err) {
    console.error('❌ Error update worker:', err.message);
    res.status(500).json({ error: err.message || 'Error al actualizar trabajador' });
  }
};

exports.delete = async (req, res) => {
  try {
    const worker = await Worker.getById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

    const { rol, sede_id: userSede } = req.user;
    if (rol === 'rrhh' && worker.sede_id !== userSede) {
      return res.status(403).json({ error: 'Sin acceso a esta sede' });
    }

    await Worker.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error delete worker:', err.message);
    res.status(500).json({ error: 'Error al eliminar trabajador' });
  }
};

exports.getSedeHistory = async (req, res) => {
  try {
    const history = await Worker.getSedeHistory(req.params.id);
    res.json(history);
  } catch (err) {
    console.error('❌ Error getSedeHistory:', err.message);
    res.status(500).json({ error: 'Error al obtener historial de sedes' });
  }
};

exports.changeSede = async (req, res) => {
  try {
    const worker = await Worker.getById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

    const { rol, sede_id: userSede, id: userId } = req.user;
    if (rol === 'rrhh' && worker.sede_id !== userSede) {
      return res.status(403).json({ error: 'Sin acceso a esta sede' });
    }

    const { sede_id, motivo_cambio } = req.body;
    if (!sede_id) return res.status(400).json({ error: 'sede_id es requerido' });

    const updated = await Worker.changeSede(req.params.id, { sede_id, motivo_cambio }, userId);
    res.json(updated);
  } catch (err) {
    console.error('❌ Error changeSede:', err.message);
    res.status(500).json({ error: 'Error al cambiar sede' });
  }
};
// controllers/ticketController.js
const path = require('path');
const fs = require('fs');
const Ticket = require('../models/Ticket');
const Area = require('../models/Area');

/**
 * GET /api/tickets
 * - admin / encargado: todos (puede filtrar por sede, área, estado)
 * - area_user / rrhh: solo los suyos
 */
exports.getAll = async (req, res) => {
  try {
    const { rol, sede_id: userSede, id: userId } = req.user;
    const filters = { ...req.query };

    if (rol === 'area_user' || rol === 'rrhh') {
      filters.creado_por = userId;
    }

    // rrhh solo ve su sede
    if (rol === 'rrhh') {
      filters.sede_id = userSede;
    }

    const tickets = await Ticket.getAll(filters);
    res.json(tickets);
  } catch (err) {
    console.error('❌ Error getAll tickets:', err.message);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
};

exports.getById = async (req, res) => {
  try {
    const ticket = await Ticket.getById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const { rol, id: userId } = req.user;

    // Solo el creador, admin o encargado pueden verlo
    if (rol === 'area_user' || rol === 'rrhh') {
      if (ticket.creado_por !== userId) {
        return res.status(403).json({ error: 'Sin acceso a este ticket' });
      }
    }

    res.json(ticket);
  } catch (err) {
    console.error('❌ Error getById ticket:', err.message);
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
};

/**
 * POST /api/tickets
 * - Cualquier usuario puede crear un ticket (rrhh y area_user)
 * - El ticket hereda la sede y el área del usuario creador
 * - En multipart/form-data: campo "pdf" (archivo)
 */
exports.create = async (req, res) => {
  try {
    const { titulo, observaciones } = req.body;
    const { sede_id, area_id, id: userId } = req.user;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: 'El título es requerido' });
    }

    if (!sede_id || !area_id) {
      return res.status(400).json({ error: 'El usuario no tiene sede o área asignada' });
    }

    let pdf_path = null;
    let pdf_nombre_original = null;

    if (req.file) {
      pdf_path = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');
      pdf_nombre_original = req.file.originalname;
    }

    const ticket = await Ticket.create({
      titulo: titulo.trim(),
      observaciones: observaciones || null,
      pdf_path,
      pdf_nombre_original,
      area_id,
      sede_id,
      creado_por: userId
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error('❌ Error create ticket:', err.message);
    res.status(500).json({ error: err.message || 'Error al crear ticket' });
  }
};

/**
 * PATCH /api/tickets/:id/completar
 * Solo admin / encargado
 */
exports.completar = async (req, res) => {
  try {
    const ticket = await Ticket.getById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const updated = await Ticket.completar(req.params.id, req.user.id);
    res.json(updated);
  } catch (err) {
    console.error('❌ Error completar ticket:', err.message);
    res.status(500).json({ error: 'Error al completar ticket' });
  }
};

/**
 * PATCH /api/tickets/:id/observar
 * Solo admin / encargado. Requiere observación.
 */
exports.observar = async (req, res) => {
  try {
    const ticket = await Ticket.getById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const { observacion } = req.body;
    if (!observacion || !observacion.trim()) {
      return res.status(400).json({ error: 'La observación es requerida' });
    }

    const updated = await Ticket.observar(req.params.id, req.user.id, observacion.trim());
    res.json(updated);
  } catch (err) {
    console.error('❌ Error observar ticket:', err.message);
    res.status(500).json({ error: 'Error al observar ticket' });
  }
};

/**
 * PATCH /api/tickets/:id/reenviar
 * Solo el creador puede reenviar un ticket observado
 */
exports.reenviar = async (req, res) => {
  try {
    const ticket = await Ticket.getById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    if (ticket.creado_por !== req.user.id) {
      return res.status(403).json({ error: 'Solo el creador puede reenviar' });
    }

    if (ticket.estado !== 'observado') {
      return res.status(400).json({ error: 'Solo se pueden reenviar tickets observados' });
    }

    let pdf_path;
    let pdf_nombre_original;
    if (req.file) {
      pdf_path = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');
      pdf_nombre_original = req.file.originalname;
    }

    const updated = await Ticket.reenviar(req.params.id, {
      titulo: req.body.titulo || ticket.titulo,
      observaciones: req.body.observaciones !== undefined
        ? req.body.observaciones
        : ticket.observaciones,
      pdf_path,
      pdf_nombre_original
    });

    res.json(updated);
  } catch (err) {
    console.error('❌ Error reenviar ticket:', err.message);
    res.status(500).json({ error: 'Error al reenviar ticket' });
  }
};

exports.delete = async (req, res) => {
  try {
    const ticket = await Ticket.getById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    // Solo admin o el creador (si está pendiente)
    const { rol, id: userId } = req.user;
    if (rol !== 'admin' && ticket.creado_por !== userId) {
      return res.status(403).json({ error: 'Sin permisos para eliminar' });
    }
    if (rol !== 'admin' && ticket.estado === 'completado') {
      return res.status(400).json({ error: 'No se puede eliminar un ticket completado' });
    }

    // Borrar archivo físico si existe
    if (ticket.pdf_path) {
      const fullPath = path.join(__dirname, '..', ticket.pdf_path);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    await Ticket.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error delete ticket:', err.message);
    res.status(500).json({ error: 'Error al eliminar ticket' });
  }
};

/**
 * GET /api/tickets/:id/pdf
 * Descarga/visualiza el PDF
 */
exports.getPdf = async (req, res) => {
  try {
    const ticket = await Ticket.getById(req.params.id);
    if (!ticket || !ticket.pdf_path) {
      return res.status(404).json({ error: 'PDF no encontrado' });
    }

    const { rol, id: userId } = req.user;
    if (rol === 'area_user' || rol === 'rrhh') {
      if (ticket.creado_por !== userId) {
        return res.status(403).json({ error: 'Sin acceso a este ticket' });
      }
    }

    const fullPath = path.join(__dirname, '..', ticket.pdf_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${ticket.pdf_nombre_original || 'ticket.pdf'}"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    console.error('❌ Error getPdf:', err.message);
    res.status(500).json({ error: 'Error al obtener PDF' });
  }
};
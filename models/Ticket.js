// models/Ticket.js
const db = require('../config/database');

class Ticket {
  static async getAll({ sede_id, area_id, estado, creado_por } = {}) {
    let sql = `
      SELECT t.*,
             a.nombre AS area_nombre,
             s.nombre AS sede_nombre,
             u.nombre AS creado_por_nombre,
             r.nombre AS revisado_por_nombre
      FROM tickets t
      LEFT JOIN areas a ON t.area_id = a.id
      LEFT JOIN sedes s ON t.sede_id = s.id
      LEFT JOIN usuarios_sistema u ON t.creado_por = u.id
      LEFT JOIN usuarios_sistema r ON t.revisado_por = r.id
      WHERE 1=1
    `;
    const params = [];

    if (sede_id)      { sql += ' AND t.sede_id = ?';      params.push(sede_id); }
    if (area_id)      { sql += ' AND t.area_id = ?';      params.push(area_id); }
    if (estado)       { sql += ' AND t.estado = ?';       params.push(estado); }
    if (creado_por)   { sql += ' AND t.creado_por = ?';   params.push(creado_por); }

    sql += ' ORDER BY t.fecha_creacion DESC';

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(
      `SELECT t.*,
              a.nombre AS area_nombre,
              s.nombre AS sede_nombre,
              u.nombre AS creado_por_nombre,
              r.nombre AS revisado_por_nombre
       FROM tickets t
       LEFT JOIN areas a ON t.area_id = a.id
       LEFT JOIN sedes s ON t.sede_id = s.id
       LEFT JOIN usuarios_sistema u ON t.creado_por = u.id
       LEFT JOIN usuarios_sistema r ON t.revisado_por = r.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const {
      titulo, observaciones, pdf_path, pdf_nombre_original,
      area_id, sede_id, creado_por
    } = data;

    const [result] = await db.query(
      `INSERT INTO tickets
       (titulo, observaciones, pdf_path, pdf_nombre_original,
        area_id, sede_id, creado_por, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [
        titulo, observaciones || null,
        pdf_path || null, pdf_nombre_original || null,
        area_id, sede_id, creado_por
      ]
    );
    return this.getById(result.insertId);
  }

  /**
   * Encargado aprueba el ticket
   */
  static async completar(id, revisado_por) {
    await db.query(
      `UPDATE tickets
       SET estado = 'completado',
           revisado_por = ?,
           fecha_revision = CURRENT_TIMESTAMP,
           observacion_revision = NULL
       WHERE id = ?`,
      [revisado_por, id]
    );
    return this.getById(id);
  }

  /**
   * Encargado observa el ticket (necesita observación)
   */
  static async observar(id, revisado_por, observacion) {
    await db.query(
      `UPDATE tickets
       SET estado = 'observado',
           revisado_por = ?,
           fecha_revision = CURRENT_TIMESTAMP,
           observacion_revision = ?
       WHERE id = ?`,
      [revisado_por, observacion, id]
    );
    return this.getById(id);
  }

  /**
   * El area_user puede reenviar un ticket observado (vuelve a pendiente)
   */
  static async reenviar(id, { titulo, observaciones, pdf_path, pdf_nombre_original }) {
    const updates = [];
    const params = [];

    if (titulo !== undefined)        { updates.push('titulo = ?');        params.push(titulo); }
    if (observaciones !== undefined) { updates.push('observaciones = ?'); params.push(observaciones); }
    if (pdf_path !== undefined) {
      updates.push('pdf_path = ?');           params.push(pdf_path);
      updates.push('pdf_nombre_original = ?'); params.push(pdf_nombre_original);
    }

    updates.push("estado = 'pendiente'");
    updates.push('observacion_revision = NULL');
    updates.push('revisado_por = NULL');
    updates.push('fecha_revision = NULL');

    params.push(id);
    await db.query(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, params);
    return this.getById(id);
  }

  static async delete(id) {
    await db.query('DELETE FROM tickets WHERE id = ?', [id]);
  }
}

module.exports = Ticket;
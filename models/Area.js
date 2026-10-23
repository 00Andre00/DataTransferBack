// models/Area.js
const db = require('../config/database');

class Area {
  static async getAll({ sede_id } = {}) {
    let sql = `
      SELECT a.*, s.nombre AS sede_nombre
      FROM areas a
      LEFT JOIN sedes s ON a.sede_id = s.id
    `;
    const params = [];

    if (sede_id) {
      sql += ' WHERE a.sede_id = ?';
      params.push(sede_id);
    }

    sql += ' ORDER BY a.nombre';

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(
      `SELECT a.*, s.nombre AS sede_nombre
       FROM areas a
       LEFT JOIN sedes s ON a.sede_id = s.id
       WHERE a.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ sede_id, nombre }) {
    const [result] = await db.query(
      `INSERT INTO areas (sede_id, nombre)
       VALUES (?, ?)`,
      [sede_id, nombre]
    );
    return this.getById(result.insertId);
  }

  static async update(id, data) {
    const allowed = ['nombre', 'activa'];
    const fields = [];
    const values = [];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        let value = data[key];
        if (key === 'activa') value = value ? 1 : 0;
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (!fields.length) return this.getById(id);

    values.push(id);
    await db.query(`UPDATE areas SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getById(id);
  }

  static async canDelete(id) {
    const [tickets] = await db.query(
      `SELECT COUNT(*) AS total FROM tickets WHERE area_id = ?`, [id]
    );
    const [usuarios] = await db.query(
      `SELECT COUNT(*) AS total FROM usuarios_sistema WHERE area_id = ?`, [id]
    );
    const [workers] = await db.query(
      `SELECT COUNT(*) AS total FROM workers WHERE area_id = ?`, [id]
    );

    return {
      canDelete: tickets[0].total === 0 && usuarios[0].total === 0,
      ticketsCount: tickets[0].total,
      usuariosCount: usuarios[0].total,
      workersCount: workers[0].total,
      workersWarning: workers[0].total > 0
    };
  }

  static async delete(id) {
    const info = await this.canDelete(id);
    if (!info.canDelete) {
      throw new Error('No se puede eliminar: hay tickets o usuarios vinculados al área');
    }
    // Si hay workers, los dejamos sin área (FK ON DELETE SET NULL)
    await db.query('DELETE FROM areas WHERE id = ?', [id]);
  }
}

module.exports = Area;
// models/Sede.js
const db = require('../config/database');

class Sede {
  static async getAll() {
    const [rows] = await db.query(
      `SELECT * FROM sedes WHERE activa = 1 ORDER BY nombre`
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(`SELECT * FROM sedes WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  static async create({ id, nombre, codigo, direccion }) {
    await db.query(
      `INSERT INTO sedes (id, nombre, codigo, direccion, activa)
       VALUES (?, ?, ?, ?, 1)`,
      [id, nombre, codigo || null, direccion || null]
    );
    return this.getById(id);
  }

  static async update(id, data) {
    const allowed = ['nombre', 'codigo', 'direccion', 'activa'];
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
    await db.query(`UPDATE sedes SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getById(id);
  }

  /**
   * Advertencia: cuántos workers, áreas, usuarios y tickets dependen
   */
  static async canDelete(id) {
    const [workers] = await db.query(
      `SELECT COUNT(*) AS total FROM workers WHERE sede_id = ?`, [id]
    );
    const [areas] = await db.query(
      `SELECT COUNT(*) AS total FROM areas WHERE sede_id = ?`, [id]
    );
    const [usuarios] = await db.query(
      `SELECT COUNT(*) AS total FROM usuarios_sistema WHERE sede_id = ?`, [id]
    );
    const [tickets] = await db.query(
      `SELECT COUNT(*) AS total FROM tickets WHERE sede_id = ?`, [id]
    );

    return {
      canDelete: workers[0].total === 0 && areas[0].total === 0 &&
                 usuarios[0].total === 0 && tickets[0].total === 0,
      workersCount: workers[0].total,
      areasCount: areas[0].total,
      usuariosCount: usuarios[0].total,
      ticketsCount: tickets[0].total
    };
  }

  static async delete(id) {
    const { canDelete } = await this.canDelete(id);
    if (!canDelete) {
      throw new Error('No se puede eliminar: la sede tiene dependencias');
    }
    await db.query('DELETE FROM sedes WHERE id = ?', [id]);
  }
}

module.exports = Sede;
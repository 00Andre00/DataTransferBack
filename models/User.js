// models/User.js
const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async findByUsername(username) {
    const [rows] = await db.query(
      `SELECT u.*, s.nombre AS sede_nombre, a.nombre AS area_nombre
       FROM usuarios_sistema u
       LEFT JOIN sedes s ON u.sede_id = s.id
       LEFT JOIN areas a ON u.area_id = a.id
       WHERE u.username = ? AND u.activo = 1`,
      [username]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.nombre, u.rol, u.sede_id, u.area_id,
              s.nombre AS sede_nombre, a.nombre AS area_nombre
       FROM usuarios_sistema u
       LEFT JOIN sedes s ON u.sede_id = s.id
       LEFT JOIN areas a ON u.area_id = a.id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async getAll() {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.nombre, u.rol, u.sede_id, u.area_id, u.activo,
              s.nombre AS sede_nombre, a.nombre AS area_nombre
       FROM usuarios_sistema u
       LEFT JOIN sedes s ON u.sede_id = s.id
       LEFT JOIN areas a ON u.area_id = a.id
       ORDER BY u.rol, u.username`
    );
    return rows;
  }

  static async create(data) {
    const { username, password, nombre, rol, sede_id, area_id } = data;
    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios_sistema (username, password_hash, nombre, rol, sede_id, area_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hash, nombre, rol, sede_id || null, area_id || null]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const allowed = ['username', 'nombre', 'rol', 'sede_id', 'area_id', 'activo'];
    const fields = [];
    const values = [];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    // Password opcional
    if (data.password && data.password.trim()) {
      const hash = await bcrypt.hash(data.password, 10);
      fields.push('password_hash = ?');
      values.push(hash);
    }

    if (!fields.length) return this.findById(id);

    values.push(id);
    await db.query(`UPDATE usuarios_sistema SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async delete(id) {
    await db.query('DELETE FROM usuarios_sistema WHERE id = ?', [id]);
  }

  static async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  }
}

module.exports = User;
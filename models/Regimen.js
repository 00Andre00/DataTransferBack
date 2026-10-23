// models/Regimen.js
const db = require('../config/database');

class Regimen {
  static async getAll() {
    const [rows] = await db.query(
      `SELECT * FROM regimenes WHERE activo = 1 ORDER BY nombre`
    );
    return rows;
  }

  static async getByCodigo(codigo) {
    const [rows] = await db.query(
      `SELECT * FROM regimenes WHERE codigo = ?`,
      [codigo]
    );
    return rows[0] || null;
  }

  static async create({ codigo, nombre, tiene_fecha_salida, descripcion }) {
    await db.query(
      `INSERT INTO regimenes (codigo, nombre, tiene_fecha_salida, descripcion)
       VALUES (?, ?, ?, ?)`,
      [codigo, nombre, tiene_fecha_salida ? 1 : 0, descripcion || null]
    );
    return this.getByCodigo(codigo);
  }

  static async update(codigo, data) {
    const allowed = ['nombre', 'tiene_fecha_salida', 'descripcion', 'activo'];
    const fields = [];
    const values = [];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        let value = data[key];
        if (key === 'tiene_fecha_salida' || key === 'activo') value = value ? 1 : 0;
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (!fields.length) return this.getByCodigo(codigo);

    values.push(codigo);
    await db.query(`UPDATE regimenes SET ${fields.join(', ')} WHERE codigo = ?`, values);
    return this.getByCodigo(codigo);
  }

  static async renameCodigo(oldCodigo, newCodigo) {
    await db.query(
      `UPDATE regimenes SET codigo = ? WHERE codigo = ?`,
      [newCodigo, oldCodigo]
    );
    return this.getByCodigo(newCodigo);
  }

  static async countWorkers(codigo) {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM workers WHERE regimen_codigo = ?`,
      [codigo]
    );
    return rows[0].total;
  }

  static async canDelete(codigo) {
    const count = await this.countWorkers(codigo);
    return { canDelete: count === 0, workersCount: count };
  }

  static async delete(codigo) {
    const { canDelete } = await this.canDelete(codigo);
    if (!canDelete) {
      throw new Error(`No se puede eliminar: hay trabajadores con este régimen`);
    }
    await db.query('DELETE FROM regimenes WHERE codigo = ?', [codigo]);
  }
}

module.exports = Regimen;
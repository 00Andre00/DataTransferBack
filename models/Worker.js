// models/Worker.js
const db = require('../config/database');

class Worker {
  static async getAll({ sede_id } = {}) {
    let sql = `
      SELECT w.*, s.nombre AS sede_nombre,
             a.nombre AS area_nombre,
             r.nombre AS regimen_nombre, r.tiene_fecha_salida
      FROM workers w
      LEFT JOIN sedes s ON w.sede_id = s.id
      LEFT JOIN areas a ON w.area_id = a.id
      LEFT JOIN regimenes r ON w.regimen_codigo = r.codigo
    `;
    const params = [];

    if (sede_id) {
      sql += ' WHERE w.sede_id = ?';
      params.push(sede_id);
    }

    sql += ' ORDER BY w.nombre_completo';

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(
      `SELECT w.*, s.nombre AS sede_nombre,
              a.nombre AS area_nombre,
              r.nombre AS regimen_nombre, r.tiene_fecha_salida
       FROM workers w
       LEFT JOIN sedes s ON w.sede_id = s.id
       LEFT JOIN areas a ON w.area_id = a.id
       LEFT JOIN regimenes r ON w.regimen_codigo = r.codigo
       WHERE w.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByDni(dni) {
    const [rows] = await db.query(`SELECT * FROM workers WHERE dni = ?`, [dni]);
    return rows[0] || null;
  }

  static async create(data) {
    const {
      dni, nombre_completo, area_id, regimen_codigo,
      fecha_ingreso, fecha_salida, sede_id, estado
    } = data;

    // Si el régimen NO tiene fecha_salida, la forzamos a null
    const [rRows] = await db.query(
      `SELECT tiene_fecha_salida FROM regimenes WHERE codigo = ?`,
      [regimen_codigo]
    );
    const tieneSalida = rRows[0]?.tiene_fecha_salida === 1;
    const fechaSalidaFinal = tieneSalida ? (fecha_salida || null) : null;

    const [result] = await db.query(
      `INSERT INTO workers
       (dni, nombre_completo, area_id, regimen_codigo, fecha_ingreso,
        fecha_salida, sede_id, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dni, nombre_completo, area_id || null, regimen_codigo,
        fecha_ingreso, fechaSalidaFinal, sede_id, estado || 'activo'
      ]
    );

    await db.query(
      `INSERT INTO worker_sede_history
       (worker_id, sede_id, fecha_inicio, motivo_cambio)
       VALUES (?, ?, ?, ?)`,
      [result.insertId, sede_id, fecha_ingreso, 'Registro inicial']
    );

    return this.getById(result.insertId);
  }

  static async update(id, data) {
    const allowed = [
      'dni', 'nombre_completo', 'area_id', 'regimen_codigo',
      'fecha_ingreso', 'fecha_salida', 'sede_id', 'estado'
    ];

    if (data.regimen_codigo) {
      const [rRows] = await db.query(
        `SELECT tiene_fecha_salida FROM regimenes WHERE codigo = ?`,
        [data.regimen_codigo]
      );
      const tieneSalida = rRows[0]?.tiene_fecha_salida === 1;
      if (!tieneSalida) data.fecha_salida = null;
    }

    const fields = [];
    const values = [];

    for (const key of allowed) {
      if (data[key] === undefined) continue;
      let value = data[key];
      if (key === 'fecha_salida' && value === '') value = null;
      if (key === 'area_id' && value === '') value = null;
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (!fields.length) return this.getById(id);

    values.push(id);
    await db.query(`UPDATE workers SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getById(id);
  }

  static async delete(id) {
    await db.query('DELETE FROM workers WHERE id = ?', [id]);
  }

  static async getSedeHistory(workerId) {
    const [rows] = await db.query(
      `SELECT h.*, s.nombre AS sede_nombre
       FROM worker_sede_history h
       LEFT JOIN sedes s ON h.sede_id = s.id
       WHERE h.worker_id = ?
       ORDER BY h.fecha_inicio DESC`,
      [workerId]
    );
    return rows;
  }

  static async changeSede(workerId, { sede_id, motivo_cambio }, userId) {
    await db.query(
      `UPDATE worker_sede_history
       SET fecha_fin = CURDATE()
       WHERE worker_id = ? AND fecha_fin IS NULL`,
      [workerId]
    );

    await db.query(
      `INSERT INTO worker_sede_history
       (worker_id, sede_id, fecha_inicio, motivo_cambio, registrado_por)
       VALUES (?, ?, CURDATE(), ?, ?)`,
      [workerId, sede_id, motivo_cambio || 'Cambio de sede', userId]
    );

    await db.query(`UPDATE workers SET sede_id = ? WHERE id = ?`, [sede_id, workerId]);
    return this.getById(workerId);
  }
}

module.exports = Worker;
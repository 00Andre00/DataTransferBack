// utils/autoInactivar.js
const db = require('../config/database');

async function autoInactivarWorkers() {
  try {
    const [result] = await db.query(`
      UPDATE workers w
      INNER JOIN regimenes r ON w.regimen_codigo = r.codigo
      SET w.estado = 'inactivo'
      WHERE w.estado = 'activo'
        AND r.tiene_fecha_salida = 1
        AND w.fecha_salida IS NOT NULL
        AND w.fecha_salida < CURDATE()
    `);

    if (result.affectedRows > 0) {
      console.log(`🔄 Auto-inactivados: ${result.affectedRows} trabajadores con contrato vencido`);
    }

    return result.affectedRows;
  } catch (err) {
    console.error('❌ Error auto-inactivando workers:', err.message);
    return 0;
  }
}

module.exports = { autoInactivarWorkers };
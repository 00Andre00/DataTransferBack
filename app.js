// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const sedesRoutes = require('./routes/sedes');
const areasRoutes = require('./routes/areas');
const regimenesRoutes = require('./routes/regimenes');
const workersRoutes = require('./routes/workers');
const ticketsRoutes = require('./routes/tickets');
const usersRoutes = require('./routes/users');
const { authenticateToken } = require('./middleware/auth');
const { autoInactivarWorkers } = require('./utils/autoInactivar');

const app = express();
const PORT = process.env.PORT || 4000;

app.disable('x-powered-by');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ RUTAS PÚBLICAS ============
app.get('/', (req, res) => {
  res.json({ message: 'Sistema de Transferencia - DRTC Huánuco API' });
});

app.use('/api/auth', authRoutes);

// ============ A PARTIR DE AQUÍ REQUIERE JWT ============
app.use(authenticateToken);

app.use('/api/sedes', sedesRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/regimenes', regimenesRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/me', (req, res) => {
  res.json({ user: req.user });
});

// ============ 404 & ERROR HANDLERS ============
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error('❌ Error global:', err.message);
  if (err.message === 'Solo se permiten archivos PDF') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'El archivo supera el límite de 10 MB' });
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ============ HEALTHCHECK + AUTO-INACTIVAR ============
(async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ Conexión a MySQL OK');

    // Auto-inactivar al arrancar
    await autoInactivarWorkers();

    // Y cada 24h
    setInterval(autoInactivarWorkers, 24 * 60 * 60 * 1000);
  } catch (err) {
    console.error('❌ Error conexión MySQL:', err.message);
  }
})();

app.listen(PORT, () => {
  console.log(`🚀 Sistema de Transferencia en http://localhost:${PORT}`);
});

module.exports = app;
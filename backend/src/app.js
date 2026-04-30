require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicles.routes');
const clientRoutes = require('./routes/clients.routes');
const contractRoutes = require('./routes/contracts.routes');
const paymentRoutes = require('./routes/payments.routes');
const voucherRoutes = require('./routes/vouchers.routes');
const crmRoutes = require('./routes/crm.routes');
const reportRoutes = require('./routes/reports.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const taxRoutes = require('./routes/tax.routes');
const userRoutes = require('./routes/users.routes');
const publicRoutes = require('./routes/public.routes');

const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/users', userRoutes);
app.use('/api/public', publicRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', service: 'Veloxrent ERP API' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: true,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚗 Veloxrent ERP API corriendo en puerto ${PORT}`);
  console.log(`📋 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

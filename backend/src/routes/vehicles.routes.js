const express = require('express');
const router = express.Router();
const vehicles = require('../controllers/vehicles.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// GET /api/vehicles - Operador+
router.get('/', authenticate, vehicles.getAll);

// GET /api/vehicles/alerts - Operador+
router.get('/alerts', authenticate, vehicles.getAlerts);

// GET /api/vehicles/available - Operador+
router.get('/available', authenticate, vehicles.getAvailable);

// GET /api/vehicles/:id - Operador+
router.get('/:id', authenticate, vehicles.getById);

// POST /api/vehicles - Solo Admin
router.post('/', authenticate, authorize('admin'), vehicles.create);

// PUT /api/vehicles/:id - Solo Admin
router.put('/:id', authenticate, authorize('admin'), vehicles.update);

// DELETE /api/vehicles/:id - Solo Admin
router.delete('/:id', authenticate, authorize('admin'), vehicles.remove);

module.exports = router;

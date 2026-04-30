const express = require('express');
const router = express.Router();
const publicCtrl = require('../controllers/public.controller');

// Rutas sin autenticación
router.get('/vehicles', publicCtrl.getAvailableVehicles);
router.post('/reservations', publicCtrl.createReservation);

module.exports = router;

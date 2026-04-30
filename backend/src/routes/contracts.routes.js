const express = require('express');
const router = express.Router();
const contracts = require('../controllers/contracts.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', authenticate, contracts.getAll);
router.get('/alerts/web', authenticate, contracts.getWebAlerts);
router.get('/:id', authenticate, contracts.getById);
router.post('/', contracts.create); // Público para reserva web
router.put('/:id/confirm', authenticate, contracts.confirm);
router.put('/:id/open', authenticate, contracts.open);
router.put('/:id/close', authenticate, contracts.close);
router.put('/:id/cancel', authenticate, authorize('admin'), contracts.cancel);

module.exports = router;

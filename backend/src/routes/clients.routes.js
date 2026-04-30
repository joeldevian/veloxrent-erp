const express = require('express');
const router = express.Router();
const clients = require('../controllers/clients.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', authenticate, clients.getAll);
router.get('/:id', authenticate, clients.getById);
router.post('/', authenticate, clients.create);
router.put('/:id', authenticate, clients.update);
router.put('/:id/status', authenticate, clients.updateStatus);

module.exports = router;

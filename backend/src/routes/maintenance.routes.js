const express = require('express');
const router = express.Router();
const maintenance = require('../controllers/maintenance.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', authenticate, authorize('admin'), maintenance.getAll);
router.post('/', authenticate, authorize('admin'), maintenance.create);
router.delete('/:id', authenticate, authorize('admin'), maintenance.remove);

module.exports = router;

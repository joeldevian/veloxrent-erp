const express = require('express');
const router = express.Router();
const users = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', authenticate, authorize('admin'), users.getAll);
router.post('/', authenticate, authorize('admin'), users.create);
router.put('/:id', authenticate, authorize('admin'), users.update);
router.put('/:id/deactivate', authenticate, authorize('admin'), users.deactivate);

module.exports = router;

const express = require('express');
const router = express.Router();
const tax = require('../controllers/tax.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/config', authenticate, authorize('admin'), tax.getConfig);
router.put('/config', authenticate, authorize('admin'), tax.updateConfig);

module.exports = router;

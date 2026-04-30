const express = require('express');
const router = express.Router();
const payments = require('../controllers/payments.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', authenticate, authorize('admin'), payments.getAll);
router.post('/', authenticate, payments.create);
router.get('/cashclose', authenticate, authorize('admin'), payments.cashClose);

module.exports = router;

const express = require('express');
const router = express.Router();
const reports = require('../controllers/reports.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/income', authenticate, authorize('admin'), reports.income);
router.get('/fleet', authenticate, authorize('admin'), reports.fleet);
router.get('/payment-methods', authenticate, authorize('admin'), reports.paymentMethods);
router.get('/vouchers', authenticate, authorize('admin'), reports.vouchersReport);
router.get('/crm', authenticate, authorize('admin'), reports.crmReport);

module.exports = router;

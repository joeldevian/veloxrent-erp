const express = require('express');
const router = express.Router();
const vouchers = require('../controllers/vouchers.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.post('/receipt', authenticate, vouchers.emitReceipt);
router.post('/invoice', authenticate, vouchers.emitInvoice);
router.get('/', authenticate, authorize('admin'), vouchers.getAll);
router.post('/:id/credit-note', authenticate, authorize('admin'), vouchers.creditNote);
router.post('/:id/resend', authenticate, vouchers.resend);

module.exports = router;

const express = require('express');
const router = express.Router();
const crm = require('../controllers/crm.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/pipeline', authenticate, crm.getPipeline);
router.get('/inactive', authenticate, crm.getInactive);
router.post('/interactions', authenticate, crm.createInteraction);
router.get('/clients/:id/timeline', authenticate, crm.getTimeline);

module.exports = router;

const express = require('express');
const router = express.Router();
const { login, logout, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// POST /api/auth/login - Público
router.post('/login', login);

// POST /api/auth/logout - Autenticado
router.post('/logout', authenticate, logout);

// GET /api/auth/me - Autenticado
router.get('/me', authenticate, getMe);

module.exports = router;

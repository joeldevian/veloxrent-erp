const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Genera un JWT con los datos del usuario
 */
function generateToken(user) {
  const payload = {
    userId: user.id,
    role: user.role,
    fullName: user.full_name
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

/**
 * Verifica y decodifica un JWT
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { generateToken, verifyToken };

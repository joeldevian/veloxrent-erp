const { verifyToken } = require('../utils/jwt');

/**
 * Middleware de autenticación JWT
 * Extrae y verifica el token del header Authorization
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Token de autenticación requerido'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      fullName: decoded.fullName
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Token expirado. Inicie sesión nuevamente'
      });
    }
    return res.status(401).json({
      error: true,
      message: 'Token inválido'
    });
  }
}

/**
 * Middleware de autorización por roles
 * Uso: authorize('admin') o authorize('admin', 'operator')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'No autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: true,
        message: 'No tiene permisos para realizar esta acción'
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };

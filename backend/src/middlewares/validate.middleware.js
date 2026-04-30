const { validationResult } = require('express-validator');

/**
 * Middleware que verifica los resultados de express-validator
 * Si hay errores, retorna 400 con la lista de errores
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Error de validación',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
}

module.exports = { validate };

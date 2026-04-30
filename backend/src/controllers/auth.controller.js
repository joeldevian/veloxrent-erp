const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

/**
 * POST /api/auth/login
 * Inicia sesión y retorna JWT
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: true,
        message: 'Credenciales incorrectas'
      });
    }

    // Verificar que esté activo
    if (!user.is_active) {
      return res.status(403).json({
        error: true,
        message: 'Cuenta desactivada. Contacte al administrador'
      });
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        error: true,
        message: 'Credenciales incorrectas'
      });
    }

    // Generar token
    const token = generateToken(user);

    res.json({
      error: false,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: true,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * POST /api/auth/logout
 * Cierra sesión (client-side token removal)
 */
async function logout(req, res) {
  res.json({
    error: false,
    message: 'Sesión cerrada correctamente'
  });
}

/**
 * GET /api/auth/me
 * Retorna los datos del usuario autenticado
 */
async function getMe(req, res) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, is_active, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: true,
        message: 'Usuario no encontrado'
      });
    }

    res.json({ error: false, data: user });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ error: true, message: 'Error interno del servidor' });
  }
}

module.exports = { login, logout, getMe };

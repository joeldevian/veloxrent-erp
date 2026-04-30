import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-blob login-blob-1"></div>
      <div className="login-blob login-blob-2"></div>
      <div className="login-blob login-blob-3"></div>

      <div className="login-card animate-slide">
        <div className="login-logo">VR</div>
        <h1 className="login-title">Veloxrent ERP</h1>
        <p className="login-subtitle">Sistema de gestión de alquiler de vehículos</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <input
            id="login-email"
            className="login-input"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              className="login-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#757575', cursor: 'pointer'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button id="login-submit" className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}

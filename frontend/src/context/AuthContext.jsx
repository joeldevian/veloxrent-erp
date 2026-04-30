import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('veloxrent_token');
    const savedUser = localStorage.getItem('veloxrent_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('veloxrent_token', newToken);
    localStorage.setItem('veloxrent_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('veloxrent_token');
    localStorage.removeItem('veloxrent_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'operator';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isOperator, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}

import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Car, Users, FileText, CreditCard, Receipt, BarChart3,
  Wrench, Settings, UserCircle, Search, LogOut, LayoutDashboard,
  MessageSquare
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'operator'] },
  { path: '/fleet', label: 'Flota', icon: Car, roles: ['admin', 'operator'] },
  { path: '/clients', label: 'Clientes', icon: Users, roles: ['admin', 'operator'] },
  { path: '/contracts', label: 'Contratos', icon: FileText, roles: ['admin', 'operator'] },
  { path: '/payments', label: 'Caja y Pagos', icon: CreditCard, roles: ['admin', 'operator'] },
  { path: '/vouchers', label: 'Comprobantes', icon: Receipt, roles: ['admin'] },
  { path: '/crm', label: 'CRM', icon: MessageSquare, roles: ['admin', 'operator'] },
  { path: '/reports', label: 'Reportes', icon: BarChart3, roles: ['admin'] },
  { path: '/maintenance', label: 'Mantenimiento', icon: Wrench, roles: ['admin'] },
  { path: '/settings', label: 'Configuración', icon: Settings, roles: ['admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">V</div>
        <span className="sidebar-logo-text">Veloxrent</span>
      </div>

      <div className="sidebar-search">
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#757575' }} />
          <input type="text" placeholder="Buscar..." />
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', marginBottom: 4 }}>
          <UserCircle size={18} style={{ color: '#b0bec5' }} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{user?.full_name}</div>
            <div style={{ fontSize: 10, color: '#757575', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

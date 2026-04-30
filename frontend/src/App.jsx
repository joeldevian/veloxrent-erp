import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FleetList from './pages/fleet/FleetList';
import ClientList from './pages/clients/ClientList';
import ContractList from './pages/contracts/ContractList';
import PaymentList from './pages/payments/PaymentList';
import VoucherList from './pages/vouchers/VoucherList';
import CRMPipeline from './pages/crm/CRMPipeline';
import ReportsPage from './pages/reports/ReportsPage';
import MaintenanceList from './pages/maintenance/MaintenanceList';
import SettingsPage from './pages/settings/SettingsPage';
import PublicCatalog from './pages/public/PublicCatalog';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;

  return children;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <Routes>
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/fleet" element={<ProtectedRoute><FleetList /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><ClientList /></ProtectedRoute>} />
        <Route path="/contracts" element={<ProtectedRoute><ContractList /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentList /></ProtectedRoute>} />
        <Route path="/vouchers" element={<ProtectedRoute roles={['admin']}><VoucherList /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute><CRMPipeline /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={['admin']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute roles={['admin']}><MaintenanceList /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={['admin']}><SettingsPage /></ProtectedRoute>} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/reserva" element={<PublicCatalog />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

import { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import {
  Car, Users, FileText, TrendingUp, AlertTriangle, DollarSign
} from 'lucide-react';
import { vehicleService, contractService, clientService } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalVehicles: 0, available: 0, rented: 0, maintenance: 0,
    activeContracts: 0, totalClients: 0, pendingReservations: 0
  });
  const [alerts, setAlerts] = useState({ soat: [], insurance: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vehiclesRes, contractsRes, clientsRes] = await Promise.all([
        vehicleService.getAll(),
        contractService.getAll(),
        clientService.getAll()
      ]);

      const vehicles = vehiclesRes.data.data || [];
      const contracts = contractsRes.data.data || [];
      const clients = clientsRes.data.data || [];

      setStats({
        totalVehicles: vehicles.length,
        available: vehicles.filter(v => v.status === 'disponible').length,
        rented: vehicles.filter(v => v.status === 'alquilado').length,
        maintenance: vehicles.filter(v => v.status === 'mantenimiento').length,
        activeContracts: contracts.filter(c => c.status === 'active').length,
        pendingReservations: contracts.filter(c => c.status === 'pending').length,
        totalClients: clients.length
      });

      try {
        const alertsRes = await vehicleService.getAlerts();
        setAlerts(alertsRes.data.data || { soat: [], insurance: [] });
      } catch (e) { /* alertas opcionales */ }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: 'Flota Total', value: stats.totalVehicles, label: 'vehículos registrados', icon: Car },
    { title: 'Disponibles', value: stats.available, label: 'listos para alquilar', icon: Car },
    { title: 'Alquilados', value: stats.rented, label: 'contratos activos', icon: TrendingUp },
    { title: 'Contratos Activos', value: stats.activeContracts, label: 'en curso hoy', icon: FileText },
    { title: 'Reservas Pendientes', value: stats.pendingReservations, label: 'por confirmar', icon: AlertTriangle },
    { title: 'Clientes', value: stats.totalClients, label: 'registrados', icon: Users },
  ];

  if (loading) {
    return (
      <div className="main-content">
        <TopBar title="Dashboard" />
        <div style={{ textAlign: 'center', padding: 60, color: '#757575' }}>Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <TopBar title="Dashboard" />

      <div className="dashboard-grid">
        {cards.map((card, i) => (
          <div className="dash-card animate-fade" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="dash-card-header">
              <card.icon size={18} />
              {card.title}
            </div>
            <div className="dash-card-value">{card.value}</div>
            <div className="dash-card-label">{card.label}</div>
          </div>
        ))}
      </div>

      {(alerts.soat_alerts?.length > 0 || alerts.insurance_alerts?.length > 0) && (
        <div className="data-table-container" style={{ marginTop: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E65100' }}>
              <AlertTriangle size={20} /> Alertas de Vencimiento
            </h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Fecha Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {(alerts.soat_alerts || []).map(a => (
                <tr key={`soat-${a.id}`}>
                  <td>{a.brand} {a.model}</td>
                  <td>{a.plate}</td>
                  <td><span className="badge badge-orange">SOAT</span></td>
                  <td>{a.soat_expiry}</td>
                </tr>
              ))}
              {(alerts.insurance_alerts || []).map(a => (
                <tr key={`ins-${a.id}`}>
                  <td>{a.brand} {a.model}</td>
                  <td>{a.plate}</td>
                  <td><span className="badge badge-red">Seguro</span></td>
                  <td>{a.insurance_expiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

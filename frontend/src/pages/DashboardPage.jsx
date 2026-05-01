import { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import { Link } from 'react-router-dom';
import {
  Car, Users, FileText, TrendingUp, AlertTriangle, DollarSign,
  Calendar, Clock, CheckCircle, ArrowRight, ArrowLeft, PlusCircle
} from 'lucide-react';
import { vehicleService, contractService, clientService, paymentService } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalVehicles: 0, available: 0, rented: 0, maintenance: 0,
    activeContracts: 0, totalClients: 0, pendingReservations: 0, totalDay: 0
  });
  const [alerts, setAlerts] = useState({ soat: [], insurance: [] });
  const [todayData, setTodayData] = useState({
    salidas: [], retornos: [], pendientes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const todayISOStart = todayStart.toISOString();
      const todayISOEnd = todayEnd.toISOString();

      const [vehiclesRes, contractsRes, clientsRes, paymentsRes] = await Promise.all([
        vehicleService.getAll(),
        contractService.getAll(),
        clientService.getAll(),
        paymentService.getAll({ from: todayISOStart, to: todayISOEnd })
      ]);

      const vehicles = vehiclesRes.data.data || [];
      const contracts = contractsRes.data.data || [];
      const clients = clientsRes.data.data || [];
      const payments = paymentsRes.data.data || [];

      // Calculate Day Total
      const totalDay = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      setStats({
        totalVehicles: vehicles.length,
        available: vehicles.filter(v => v.status === 'disponible').length,
        rented: vehicles.filter(v => v.status === 'alquilado').length,
        maintenance: vehicles.filter(v => v.status === 'mantenimiento').length,
        activeContracts: contracts.filter(c => c.status === 'active').length,
        pendingReservations: contracts.filter(c => c.status === 'pending').length,
        totalClients: clients.length,
        totalDay
      });

      // Seccion HOY
      const salidas = contracts.filter(c => c.status === 'confirmed' && c.start_datetime >= todayISOStart && c.start_datetime <= todayISOEnd);
      const retornos = contracts.filter(c => c.status === 'active' && c.end_datetime_planned >= todayISOStart && c.end_datetime_planned <= todayISOEnd);
      const pendientes = contracts.filter(c => c.status === 'pending');

      setTodayData({ salidas, retornos, pendientes });

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

  const isLate = (dateString) => new Date(dateString) < new Date();

  if (loading) {
    return (
      <div className="main-content">
        <TopBar title="Dashboard" />
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <div className="spinner"></div>
          <p style={{marginTop: 16}}>Cargando panel operativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <TopBar title="Dashboard" />

      {/* QUICK ACTIONS */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <Link to="/reserva" className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 20px', fontSize: 15 }}>
          <PlusCircle size={18} /> Nueva Reserva
        </Link>
        <Link to="/clientes" className="btn btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 20px', fontSize: 15, background: 'white' }}>
          <Users size={18} /> Nuevo Cliente
        </Link>
        <Link to="/contratos" className="btn btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 20px', fontSize: 15, background: 'white' }}>
          <FileText size={18} /> Abrir Contrato
        </Link>
        <Link to="/comprobantes" className="btn btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 20px', fontSize: 15, background: 'white' }}>
          <DollarSign size={18} /> Emitir Comprobante
        </Link>
      </div>

      {/* KPIs */}
      <div className="dashboard-grid">
        <div className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ color: '#64748B', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Flota Total</div>
            <div style={{ background: '#F1F5F9', padding: 8, borderRadius: 8, color: '#334155' }}><Car size={18}/></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{stats.totalVehicles}</div>
        </div>
        <div className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ color: '#64748B', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Disponibles</div>
            <div style={{ background: '#DCFCE7', padding: 8, borderRadius: 8, color: '#16A34A' }}><CheckCircle size={18}/></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{stats.available}</div>
        </div>
        <div className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ color: '#64748B', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alquilados</div>
            <div style={{ background: '#DBEAFE', padding: 8, borderRadius: 8, color: '#2563EB' }}><TrendingUp size={18}/></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{stats.rented}</div>
        </div>
        <div className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ color: '#64748B', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contratos Activos</div>
            <div style={{ background: '#F1F5F9', padding: 8, borderRadius: 8, color: '#334155' }}><FileText size={18}/></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{stats.activeContracts}</div>
        </div>
        <div className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ color: '#64748B', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reservas Pendientes</div>
            <div style={{ background: '#FEF3C7', padding: 8, borderRadius: 8, color: '#D97706' }}><Clock size={18}/></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{stats.pendingReservations}</div>
        </div>
        <div className="dash-card" style={{ background: '#1A1A2E', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ color: '#94A3B8', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total del Día</div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 8, color: '#22C55E' }}><DollarSign size={18}/></div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1 }}>S/ {stats.totalDay.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'stretch' }}>
        {/* SECCIÓN HOY */}
        <div className="dash-card" style={{ flex: 2, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} color="#3B82F6" /> Operaciones de Hoy
            </h3>
          </div>
          
          <div style={{ display: 'flex', flex: 1 }}>
            {/* Salidas */}
            <div style={{ flex: 1, padding: 24, borderRight: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowRight size={14} color="#22C55E"/> Salidas ({todayData.salidas.length})
              </h4>
              {todayData.salidas.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94A3B8' }}>No hay salidas programadas para hoy.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {todayData.salidas.map(s => (
                    <div key={s.id} style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.clients?.full_name || 'Cliente'}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Destino: {s.trip_destination || 'No especificado'}</div>
                      <div style={{ fontSize: 12, color: '#3B82F6', marginTop: 4, fontWeight: 600 }}>Vehículo ID: {s.vehicle_id?.substring(0,8)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Retornos */}
            <div style={{ flex: 1, padding: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={14} color="#EF4444"/> Retornos ({todayData.retornos.length})
              </h4>
              {todayData.retornos.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94A3B8' }}>No hay retornos programadas para hoy.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {todayData.retornos.map(r => {
                    const delayed = isLate(r.end_datetime_planned);
                    return (
                      <div key={r.id} style={{ background: delayed ? '#FEF2F2' : '#F8FAFC', padding: 12, borderRadius: 8, border: `1px solid ${delayed ? '#FECACA' : '#E2E8F0'}` }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: delayed ? '#B91C1C' : '#0F172A' }}>{r.clients?.full_name || 'Cliente'}</div>
                        <div style={{ fontSize: 12, color: delayed ? '#DC2626' : '#64748B', marginTop: 4, fontWeight: delayed ? 600 : 400 }}>
                          Hora pactada: {new Date(r.end_datetime_planned).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {delayed && ' (Retraso)'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ALERTAS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Reservas Pendientes */}
          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#FEF3C7' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} /> Reservas Pendientes ({todayData.pendientes.length})
              </h3>
            </div>
            <div style={{ padding: 20, maxHeight: 200, overflowY: 'auto' }}>
              {todayData.pendientes.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>No hay reservas pendientes.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {todayData.pendientes.map(p => (
                    <div key={p.id} style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.clients?.full_name || 'Nuevo Cliente'}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>Telf: {p.clients?.phone || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vencimientos */}
          {(alerts.soat_alerts?.length > 0 || alerts.insurance_alerts?.length > 0) && (
            <div className="dash-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #FECACA' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #FECACA', background: '#FEF2F2' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} /> Vencimientos Próximos
                </h3>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(alerts.soat_alerts || []).map(a => (
                    <div key={`soat-${a.id}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span><strong>{a.plate}</strong> (SOAT)</span>
                      <span style={{ color: '#EF4444', fontWeight: 600 }}>{new Date(a.soat_expiry).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {(alerts.insurance_alerts || []).map(a => (
                    <div key={`ins-${a.id}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span><strong>{a.plate}</strong> (Seguro)</span>
                      <span style={{ color: '#EF4444', fontWeight: 600 }}>{new Date(a.insurance_expiry).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

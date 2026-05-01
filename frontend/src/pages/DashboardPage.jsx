import { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import { Link } from 'react-router-dom';
import {
  Car, Users, FileText, TrendingUp, AlertTriangle, DollarSign,
  Calendar, Clock, CheckCircle, ArrowRight, ArrowLeft, PlusCircle, Wrench, MapPin, Phone
} from 'lucide-react';
import { vehicleService, contractService, clientService, paymentService } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalVehicles: 0, available: 0, rented: 0, maintenance: 0,
    activeContracts: 0, totalClients: 0, pendingReservations: 0, totalDay: 0
  });
  const [alerts, setAlerts] = useState({ soat: [], insurance: [] });
  const [todayData, setTodayData] = useState({ salidas: [], retornos: [], pendientes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
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

      let salidas = contracts.filter(c => c.status === 'confirmed' && c.start_datetime >= todayISOStart && c.start_datetime <= todayISOEnd);
      let retornos = contracts.filter(c => c.status === 'active' && c.end_datetime_planned >= todayISOStart && c.end_datetime_planned <= todayISOEnd);
      const pendientes = contracts.filter(c => c.status === 'pending');

      // Datos de demo si está vacío
      if (salidas.length === 0) {
        salidas = [{ id: 'demo-s1', isDemo: true, clients: { full_name: 'Carlos Mendoza' }, trip_destination: 'Huanta', vehicles: { plate: 'ABC-123', brand: 'Toyota', model: 'Hilux' } }];
      }
      if (retornos.length === 0) {
        const t = new Date(); t.setHours(18, 0, 0, 0);
        retornos = [{ id: 'demo-r1', isDemo: true, clients: { full_name: 'Raul I. Berrocal' }, end_datetime_planned: t.toISOString(), vehicles: { plate: 'DEF-202', brand: 'Hyundai', model: 'Accent' } }];
      }

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
          <p style={{ marginTop: 16 }}>Cargando panel operativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ paddingBottom: 48 }}>
      <TopBar title="Inicio" />

      {/* FILA 1: KPIs COMPACTOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {/* KPI: Disponibles */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#DCFCE7', width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={18} color="#16A34A" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#334155', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Vehículos Libres</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', lineHeight: 1 }}>{stats.available}</div>
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>de {stats.totalVehicles} en flota</div>
          </div>
        </div>
        {/* KPI: Rentados */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#DBEAFE', width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Car size={18} color="#2563EB" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#334155', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Vehículos Rentados</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', lineHeight: 1 }}>{stats.rented}</div>
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>contratos activos</div>
          </div>
        </div>
        {/* KPI: Mantenimiento */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#FEF3C7', width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wrench size={18} color="#D97706" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#334155', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>En Mantenimiento</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', lineHeight: 1 }}>{stats.maintenance}</div>
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>vehículos en taller</div>
          </div>
        </div>
        {/* KPI: Reservas */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#F1F5F9', width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={18} color="#475569" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#334155', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Reservas Pendientes</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{stats.pendingReservations}</div>
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>esperando confirmación</div>
          </div>
        </div>
        {/* KPI: Total Día */}
        <div style={{ background: '#0F172A', border: '1px solid #0F172A', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(34,197,94,0.15)', width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={18} color="#22C55E" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Ingresos del Día</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#22C55E', lineHeight: 1 }}>S/ {stats.totalDay.toFixed(0)}</div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>caja en tiempo real</div>
          </div>
        </div>
      </div>

      {/* FILA 2: ACCIONES RÁPIDAS COMPACTAS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Link to="/contracts" state={{ openNew: true }} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 6, padding: '10px 16px', fontSize: 13 }}>
          <PlusCircle size={15} /> Nueva Reserva
        </Link>
        <Link to="/clients" state={{ openNew: true }} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', gap: 6, padding: '10px 16px', fontSize: 13, background: 'white' }}>
          <Users size={15} /> Nuevo Cliente
        </Link>
        <Link to="/contracts" state={{ openNew: true }} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', gap: 6, padding: '10px 16px', fontSize: 13, background: 'white' }}>
          <FileText size={15} /> Abrir Contrato
        </Link>
        <Link to="/vouchers" state={{ openNew: true }} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', gap: 6, padding: '10px 16px', fontSize: 13, background: 'white' }}>
          <DollarSign size={15} /> Emitir Comprobante
        </Link>
      </div>

      {/* FILA 3: OPERACIONES DE HOY — SECCIÓN PRINCIPAL */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>

        {/* PANEL IZQUIERDO: SALIDAS */}
        <div style={{ flex: 1, background: 'white', border: '2px solid #22C55E', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#F0FDF4', padding: '18px 24px', borderBottom: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ArrowRight size={20} color="#16A34A" />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>Salidas de Hoy</span>
            <span style={{ marginLeft: 'auto', background: '#22C55E', color: 'white', fontSize: 13, fontWeight: 700, borderRadius: 20, padding: '3px 12px' }}>{todayData.salidas.length}</span>
          </div>
          <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todayData.salidas.map(s => (
              <div key={s.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>{s.clients?.full_name}</span>
                  {s.isDemo && <span style={{ fontSize: 10, background: '#F1F5F9', color: '#94A3B8', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>DEMO</span>}
                </div>
                <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Car size={14} color="#64748B" /> {s.vehicles?.brand} {s.vehicles?.model} · <strong>{s.vehicles?.plate}</strong>
                </div>
                <div style={{ fontSize: 13, color: '#059669', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="#10B981" /> Destino: {s.trip_destination}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL CENTRAL: RETORNOS */}
        <div style={{ flex: 1, background: 'white', border: '2px solid #EF4444', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#FEF2F2', padding: '18px 24px', borderBottom: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ArrowLeft size={20} color="#DC2626" />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase' }}>Retornos de Hoy</span>
            <span style={{ marginLeft: 'auto', background: '#EF4444', color: 'white', fontSize: 13, fontWeight: 700, borderRadius: 20, padding: '3px 12px' }}>{todayData.retornos.length}</span>
          </div>
          <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todayData.retornos.map(r => {
              const delayed = isLate(r.end_datetime_planned);
              return (
                <div key={r.id} style={{ background: delayed ? '#FFF1F2' : '#F8FAFC', border: `1px solid ${delayed ? '#FECACA' : '#E2E8F0'}`, borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: delayed ? '#9F1239' : '#0F172A' }}>{r.clients?.full_name}</span>
                    {r.isDemo && <span style={{ fontSize: 10, background: '#F1F5F9', color: '#94A3B8', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>DEMO</span>}
                    {delayed && <span style={{ fontSize: 11, background: '#FEE2E2', color: '#DC2626', padding: '3px 10px', borderRadius: 10, fontWeight: 700 }}>RETRASO</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Car size={14} color="#64748B" /> {r.vehicles?.brand} {r.vehicles?.model} · <strong>{r.vehicles?.plate}</strong>
                  </div>
                  <div style={{ fontSize: 13, color: delayed ? '#DC2626' : '#3B82F6', marginTop: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} color={delayed ? '#EF4444' : '#3B82F6'} /> Pactado: {new Date(r.end_datetime_planned).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL DERECHO: RESERVAS PENDIENTES */}
        <div style={{ width: 280, background: 'white', border: '2px solid #F59E0B', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#FFFBEB', padding: '18px 24px', borderBottom: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={18} color="#D97706" />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>Pendientes</span>
            <span style={{ marginLeft: 'auto', background: '#F59E0B', color: 'white', fontSize: 13, fontWeight: 700, borderRadius: 20, padding: '3px 12px' }}>{todayData.pendientes.length}</span>
          </div>
          <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
            {todayData.pendientes.length === 0 ? (
              <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Sin reservas pendientes</div>
            ) : (
              todayData.pendientes.map(p => (
                <div key={p.id} style={{ padding: '12px 14px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{p.clients?.full_name}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={13} color="#D97706" /> {p.clients?.phone}
                  </div>
                </div>
              ))
            )}
          </div>

          {(alerts.soat_alerts?.length > 0 || alerts.insurance_alerts?.length > 0) && (
            <div style={{ borderTop: '1px solid #E2E8F0', padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <AlertTriangle size={13} /> Vencimientos
              </div>
              {(alerts.soat_alerts || []).slice(0, 2).map(a => (
                <div key={`soat-${a.id}`} style={{ fontSize: 11, color: '#EF4444', marginBottom: 4 }}>
                  <strong>{a.plate}</strong> · SOAT vence {new Date(a.soat_expiry).toLocaleDateString()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

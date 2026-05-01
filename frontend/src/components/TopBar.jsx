import { useState, useEffect } from 'react';
import { Bell, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contractService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TopBar({ title }) {
  const [time, setTime] = useState(new Date());
  const [alertCount, setAlertCount] = useState(0);
  const [alertsData, setAlertsData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lastSeen, setLastSeen] = useState(localStorage.getItem('last_seen_alerts') || '0');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await contractService.getWebAlerts();
        setAlertCount(res.data.count || 0);
        setAlertsData(res.data.data || []);
      } catch (e) {
        // ignore errors for polling
      }
    };
    fetchAlerts();
    const alertTimer = setInterval(fetchAlerts, 15000); // 15 seconds
    return () => clearInterval(alertTimer);
  }, []);

  const formatTime = (d) => {
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  return (
    <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1 className="topbar-title">{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => {
            setShowDropdown(!showDropdown);
            if (!showDropdown && alertsData.length > 0) {
              const newest = Math.max(...alertsData.map(a => new Date(a.created_at).getTime()));
              localStorage.setItem('last_seen_alerts', newest.toString());
              setLastSeen(newest.toString());
            }
          }}>
            <Bell size={24} color="#555" />
            {alertsData.filter(a => new Date(a.created_at).getTime() > parseInt(lastSeen)).length > 0 && (
              <div style={{ position: 'absolute', top: -5, right: -5, background: '#f44336', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {alertsData.filter(a => new Date(a.created_at).getTime() > parseInt(lastSeen)).length}
              </div>
            )}
          </div>
          
          {showDropdown && (
            <div style={{ position: 'absolute', top: 35, right: -10, width: 320, background: 'white', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 14 }}>
                Reservas Web Pendientes ({alertCount})
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {alertsData.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No hay nuevas reservas</div>
                ) : (
                  alertsData.map(alert => (
                    <div key={alert.id} onClick={() => { setShowDropdown(false); navigate('/contracts'); }} style={{ padding: 16, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{alert.clients?.full_name}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{alert.vehicles?.brand} {alert.vehicles?.model} ({alert.vehicles?.plate})</div>
                      <div style={{ fontSize: 11, color: '#3b82f6' }}>{new Date(alert.created_at).toLocaleString('es-PE')}</div>
                    </div>
                  ))
                )}
              </div>
              {alertsData.length > 0 && (
                <div onClick={() => { setShowDropdown(false); navigate('/contracts'); }} style={{ padding: 12, textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Ir a Contratos
                </div>
              )}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRight: '1px solid #e2e8f0' }}>
            <UserCircle size={20} style={{ color: '#64748b' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
          <div className="topbar-clock">{formatTime(time)}</div>
        </div>
      </div>
    </div>
  );
}

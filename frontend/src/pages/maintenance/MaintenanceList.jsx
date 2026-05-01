import TopBar from '../../components/TopBar';
import { useState, useEffect } from 'react';
import { maintenanceService, vehicleService } from '../../services/api';
import { Plus, Wrench, X, CheckCircle, Trash2, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { Toast, showAlert, showConfirm } from '../../utils/alert';

const TYPE_COLORS = {
  preventivo: { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
  correctivo: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
};

export default function MaintenanceList() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: '',
    maintenance_type: 'preventivo',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    provider: '',
    notes: ''
  });

  useEffect(() => { loadRecords(); loadVehicles(); }, []);

  const loadRecords = async () => {
    try { 
      const res = await maintenanceService.getAll(); 
      setRecords(res.data.data || []); 
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadVehicles = async () => {
    try { 
      const res = await vehicleService.getAll(); 
      setVehicles(res.data.data || []); 
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await maintenanceService.create(form);
      await vehicleService.update(form.vehicle_id, { status: 'mantenimiento' });
      setShowModal(false);
      setForm({ vehicle_id: '', maintenance_type: 'preventivo', date: new Date().toISOString().split('T')[0], cost: '', provider: '', notes: '' });
      loadRecords();
      loadVehicles();
      Toast.fire({ icon: 'success', title: 'Mantenimiento registrado' });
    } catch (error) {
      showAlert('Error al guardar mantenimiento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (await showConfirm('¿Eliminar este registro de mantenimiento?')) {
      try {
        await maintenanceService.remove(id);
        loadRecords();
        Toast.fire({ icon: 'success', title: 'Registro eliminado' });
      } catch (error) {
        showAlert('Error al eliminar', 'error');
      }
    }
  };

  const handleFinalize = async (vehicle_id) => {
    if (await showConfirm('¿Confirmar que el mantenimiento terminó? El vehículo volverá a estar Disponible.')) {
      try {
        await vehicleService.update(vehicle_id, { status: 'disponible' });
        Toast.fire({ icon: 'success', title: 'Vehículo disponible nuevamente' });
        loadRecords();
        loadVehicles();
      } catch (error) {
        showAlert('Error al liberar vehículo', 'error');
      }
    }
  };

  const activeRecords = records.filter(r => r.vehicles?.status === 'mantenimiento');
  const historyRecords = records.filter(r => r.vehicles?.status !== 'mantenimiento');
  const totalCost = activeRecords.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

  return (
    <div className="main-content">
      <TopBar title="Mantenimiento de Flota" />

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#0F172A', borderRadius: 12, padding: 24, color: 'white' }}>
          <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wrench size={14} /> En Mantenimiento Ahora
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#F59E0B', lineHeight: 1 }}>{activeRecords.length}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>vehículo(s) fuera de servicio</div>
        </div>
        <div className="dash-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Costo Activo Estimado</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>S/ {totalCost.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>en reparaciones en curso</div>
        </div>
        <div className="dash-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Historial Total</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{records.length}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>registros acumulados</div>
        </div>
      </div>

      {/* Header de acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={20} color="#F59E0B" /> Mantenimientos Activos
        </h3>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Registrar Mantenimiento
        </button>
      </div>

      {/* Cards de Mantenimientos Activos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Cargando...</div>
      ) : activeRecords.length === 0 ? (
        <div style={{ background: '#F8FAFC', borderRadius: 12, border: '2px dashed #E2E8F0', padding: 60, textAlign: 'center' }}>
          <Wrench size={48} style={{ margin: '0 auto 16px', opacity: 0.2, display: 'block' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#94A3B8' }}>Toda la flota está operativa</div>
          <div style={{ fontSize: 14, color: '#CBD5E1', marginTop: 4 }}>No hay vehículos en mantenimiento actualmente.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 32 }}>
          {activeRecords.map(r => {
            const colors = TYPE_COLORS[r.maintenance_type] || TYPE_COLORS.preventivo;
            return (
              <div key={r.id} style={{ background: 'white', borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: colors.text }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                      {r.vehicles?.brand} {r.vehicles?.model}
                    </div>
                    <div style={{ background: '#F1F5F9', color: '#475569', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>
                      {r.vehicles?.plate}
                    </div>
                  </div>
                  <span style={{ background: colors.bg, color: colors.text, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                    {r.maintenance_type}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                    <Calendar size={16} color="#94A3B8" />
                    <span style={{ color: '#64748B' }}>Fecha:</span>
                    <strong style={{ color: '#0F172A' }}>{r.date}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                    <DollarSign size={16} color="#94A3B8" />
                    <span style={{ color: '#64748B' }}>Costo:</span>
                    <strong style={{ color: '#0F172A' }}>S/ {parseFloat(r.cost || 0).toFixed(2)}</strong>
                  </div>
                  {r.provider && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14 }}>
                      <Wrench size={16} color="#94A3B8" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div><span style={{ color: '#64748B' }}>Taller: </span><strong style={{ color: '#0F172A' }}>{r.provider}</strong></div>
                    </div>
                  )}
                  {r.notes && (
                    <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, fontSize: 13, color: '#475569', lineHeight: 1.5, borderLeft: '3px solid #E2E8F0' }}>
                      {r.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }} onClick={() => handleFinalize(r.vehicle_id)}>
                    <CheckCircle size={16} /> Finalizar y Liberar
                  </button>
                  <button className="btn-icon" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 10 }} onClick={() => handleRemove(r.id)}>
                    <Trash2 size={16} color="#EF4444" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Historial Reciente */}
      {historyRecords.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#64748B', marginBottom: 16, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Historial de Mantenimientos</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Costo</th>
                  <th>Taller / Proveedor</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {historyRecords.slice(0, 20).map(r => {
                  const colors = TYPE_COLORS[r.maintenance_type] || TYPE_COLORS.preventivo;
                  return (
                    <tr key={r.id}>
                      <td>
                        <strong style={{ color: '#0F172A' }}>{r.vehicles?.brand} {r.vehicles?.model}</strong><br/>
                        <span style={{ fontSize: 12, background: '#F1F5F9', padding: '1px 6px', borderRadius: 4, color: '#475569', fontWeight: 700 }}>{r.vehicles?.plate}</span>
                      </td>
                      <td>
                        <span style={{ background: colors.bg, color: colors.text, padding: '3px 8px', borderRadius: 5, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{r.maintenance_type}</span>
                      </td>
                      <td style={{ color: '#64748B', fontSize: 13 }}>{r.date}</td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>S/ {parseFloat(r.cost || 0).toFixed(2)}</td>
                      <td style={{ color: '#64748B', fontSize: 13 }}>{r.provider || '—'}</td>
                      <td style={{ color: '#64748B', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540, padding: 32 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={22} color="#F59E0B" /> Registrar Mantenimiento
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Vehículo *</label>
                <select className="form-select" style={{ fontSize: 15, padding: 12, height: 'auto' }} required value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})}>
                  <option value="">Seleccionar vehículo de la flota...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate}) — {v.status}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Tipo de Mantenimiento *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {['preventivo', 'correctivo'].map(t => {
                      const c = TYPE_COLORS[t];
                      return (
                        <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: `2px solid ${form.maintenance_type === t ? c.text : '#E2E8F0'}`, background: form.maintenance_type === t ? c.bg : 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 700, color: form.maintenance_type === t ? c.text : '#64748B', textTransform: 'capitalize' }}>
                          <input type="radio" name="mtype" value={t} checked={form.maintenance_type === t} onChange={() => setForm({...form, maintenance_type: t})} style={{ display: 'none' }} />
                          {t}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Fecha *</label>
                    <input className="form-input" type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Costo (S/) *</label>
                    <input className="form-input" style={{ fontSize: 18, fontWeight: 800 }} type="number" step="0.01" min="0" required value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Taller / Proveedor</label>
                <input className="form-input" placeholder="Ej. Taller Mecánico El Motor" value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Descripción del Trabajo</label>
                <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} placeholder="Detalle del trabajo realizado o pendiente..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>

              <div className="modal-actions" style={{ marginTop: 8, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#F59E0B', borderColor: '#F59E0B' }} disabled={saving}>
                  {saving ? 'Registrando...' : 'Registrar y Poner en Mantenimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

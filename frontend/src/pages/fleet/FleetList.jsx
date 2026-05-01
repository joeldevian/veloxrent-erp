import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import { vehicleService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, RefreshCw, Trash2, Edit, X, LayoutGrid, List, AlertTriangle } from 'lucide-react';
import { Toast, showAlert, showConfirm } from '../../utils/alert';

const VEHICLE_TYPES = ['minivan', 'sedan', 'suv', 'pickup', 'van'];
const FUEL_TYPES = ['gasolina', 'diesel'];
const STATUS_MAP = {
  disponible: 'badge-green',
  alquilado: 'badge-blue',
  mantenimiento: 'badge-orange',
  fuera_de_servicio: 'badge-red'
};

const emptyVehicle = {
  brand: '', model: '', year: 2024, plate: '', type: 'sedan', fuel_type: 'gasolina',
  transmission: 'manual', traction: '4x2', color: '', seats: 5,
  base_price_per_day: '', plus_plan_price: '', libre_plan_price: '',
  km_plan_normal: 200, km_plan_plus: 300, extra_km_rate_normal: 0.90, extra_km_rate_plus: 0.60,
  guarantee_amount: 800, reservation_amount: 300, current_km: 0, current_fuel_level: 'lleno',
  soat_expiry: '', insurance_expiry: '', accessories: [], photo_url: ''
};

export default function FleetList() {
  const { isAdmin } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '', fuel_type: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState(emptyVehicle);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  useEffect(() => { loadVehicles(); }, [filter]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.type) params.type = filter.type;
      if (filter.status) params.status = filter.status;
      if (filter.fuel_type) params.fuel_type = filter.fuel_type;
      const res = await vehicleService.getAll(params);
      setVehicles(res.data.data || []);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingVehicle(null);
    setForm(emptyVehicle);
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditingVehicle(v);
    setForm({ ...v, soat_expiry: v.soat_expiry || '', insurance_expiry: v.insurance_expiry || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingVehicle) {
        await vehicleService.update(editingVehicle.id, form);
      } else {
        await vehicleService.create(form);
      }
      setShowModal(false);
      loadVehicles();
      Toast.fire({ icon: 'success', title: 'Vehículo guardado' });
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!await showConfirm('¿Desactivar este vehículo?')) return;
    try {
      await vehicleService.remove(id);
      loadVehicles();
      Toast.fire({ icon: 'success', title: 'Vehículo desactivado' });
    } catch (e) {
      showAlert('Error al desactivar', 'error');
    }
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateField(field, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const getVehiclePhoto = (v) => {
    if (v.photo_url) return v.photo_url;
    const brand = v.brand?.trim().replace(/\s+/g, '_');
    const model = v.model?.trim().replace(/\s+/g, '_');
    return `/flota_cars/${brand}_${model}.png`;
  };

  const isExpiringSoon = (dateString) => {
    if (!dateString) return false;
    const expiry = new Date(dateString);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    return expiry < in30Days;
  };

  const getFuelPercentage = (level) => {
    const map = { 'vacio': 0, '1/4': 25, '1/2': 50, '3/4': 75, 'lleno': 100 };
    return map[level] || 100;
  };

  return (
    <div className="main-content">
      <TopBar title="Gestión de Flota" />

      <div className="page-header">
        <div className="filter-bar">
          <select value={filter.type} onChange={e => setFilter(p => ({ ...p, type: e.target.value }))}>
            <option value="">Todos los tipos</option>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select value={filter.fuel_type} onChange={e => setFilter(p => ({ ...p, fuel_type: e.target.value }))}>
            <option value="">Cualquier combustible</option>
            {FUEL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
            <option value="">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="alquilado">Alquilado</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="fuera_de_servicio">Fuera de servicio</option>
          </select>
          
          <div style={{ display: 'flex', background: '#E2E8F0', borderRadius: 8, padding: 4, marginLeft: 'auto' }}>
            <button 
              style={{ background: viewMode === 'cards' ? 'white' : 'transparent', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid size={16} color={viewMode === 'cards' ? '#0F172A' : '#64748B'}/>
            </button>
            <button 
              style={{ background: viewMode === 'table' ? 'white' : 'transparent', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              onClick={() => setViewMode('table')}
            >
              <List size={16} color={viewMode === 'table' ? '#0F172A' : '#64748B'}/>
            </button>
          </div>

          <button className="btn btn-reload" onClick={loadVehicles}><RefreshCw size={16} /></button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Nuevo Vehículo
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <div className="spinner"></div>
          <p style={{marginTop: 16}}>Cargando flota...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', background: 'white', borderRadius: 12 }}>
          No hay vehículos que coincidan con los filtros.
        </div>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {vehicles.map(v => {
            const fuelPct = getFuelPercentage(v.current_fuel_level);
            const soatAlert = isExpiringSoon(v.soat_expiry);
            return (
              <div key={v.id} className="dash-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: 180, background: '#F1F5F9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img 
                    src={getVehiclePhoto(v)} 
                    alt={v.model} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Sin+Foto'; }}
                  />
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span className={`badge ${STATUS_MAP[v.status] || 'badge-gray'}`} style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{v.status}</span>
                  </div>
                  {soatAlert && (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: '#EF4444', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      <AlertTriangle size={12}/> SOAT Próximo
                    </div>
                  )}
                </div>
                
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{v.brand} {v.model}</h3>
                      <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{v.year} · {v.color}</div>
                    </div>
                    <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#334155', letterSpacing: 1 }}>
                      {v.plate}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 600 }}>Tipo / Trans.</div>
                      <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, textTransform: 'capitalize' }}>{v.type} · {v.transmission === 'automatico' ? 'Auto' : 'Man'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 600 }}>Combustible</div>
                      <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, textTransform: 'capitalize' }}>{v.fuel_type}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 600 }}>Tarifa / Día</div>
                      <div style={{ fontSize: 14, color: '#22C55E', fontWeight: 800 }}>S/ {parseFloat(v.base_price_per_day).toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 600 }}>Kilometraje</div>
                      <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{v.current_km?.toLocaleString()} km</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 6, textTransform: 'uppercase' }}>
                      <span>Nivel Combustible</span>
                      <span>{v.current_fuel_level}</span>
                    </div>
                    <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: fuelPct < 30 ? '#EF4444' : fuelPct < 60 ? '#F59E0B' : '#22C55E', width: `${fuelPct}%` }}></div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                      <button className="btn btn-outline" style={{ flex: 1, padding: '8px 0' }} onClick={() => openEdit(v)}>Editar</button>
                      <button className="btn btn-outline" style={{ padding: '8px 12px', color: '#EF4444', borderColor: '#FECACA' }} onClick={() => handleDelete(v.id)}><Trash2 size={16}/></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Transmisión</th>
                <th>Precio/Día</th>
                <th>Km Actual</th>
                <th>Estado</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 60, height: 40, borderRadius: 6, overflow: 'hidden', background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
                        <img 
                          src={getVehiclePhoto(v)} 
                          alt={v.model} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/60x40?text=No+Photo'; }}
                        />
                      </div>
                      <div>
                        <strong style={{ color: '#0F172A' }}>{v.brand} {v.model}</strong><br/>
                        <span style={{ fontSize: 12, color: '#64748B' }}>{v.year} · {v.color}</span>
                      </div>
                    </div>
                  </td>
                  <td><strong style={{ color: '#334155' }}>{v.plate}</strong></td>
                  <td style={{textTransform:'capitalize'}}>{v.type}</td>
                  <td style={{textTransform:'capitalize'}}>{v.transmission}</td>
                  <td style={{ fontWeight: 600, color: '#22C55E' }}>S/ {parseFloat(v.base_price_per_day).toFixed(2)}</td>
                  <td>{v.current_km?.toLocaleString()} km</td>
                  <td><span className={`badge ${STATUS_MAP[v.status] || 'badge-gray'}`}>{v.status}</span></td>
                  {isAdmin && (
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn-icon btn-dark" onClick={() => openEdit(v)} title="Editar"><Edit size={14} color="white"/></button>
                        <button className="btn-delete" onClick={() => handleDelete(v.id)} title="Desactivar"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth:720, padding: 32}}>
            <div className="modal-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #E2E8F0' }}>
              <h2 className="modal-title" style={{ fontSize: 20, fontWeight: 800 }}>{editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Marca *</label>
                  <input className="form-input" required value={form.brand} onChange={e => updateField('brand', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Modelo *</label>
                  <input className="form-input" required value={form.model} onChange={e => updateField('model', e.target.value)} />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Año *</label>
                  <input className="form-input" type="number" required value={form.year} onChange={e => updateField('year', parseInt(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Placa *</label>
                  <input className="form-input" required value={form.plate} onChange={e => updateField('plate', e.target.value.toUpperCase())} placeholder="ABC-123" />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input className="form-input" value={form.color} onChange={e => updateField('color', e.target.value)} />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Tipo *</label>
                  <select className="form-select" value={form.type} onChange={e => updateField('type', e.target.value)}>
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Combustible *</label>
                  <select className="form-select" value={form.fuel_type} onChange={e => updateField('fuel_type', e.target.value)}>
                    {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Transmisión</label>
                  <select className="form-select" value={form.transmission} onChange={e => updateField('transmission', e.target.value)}>
                    <option value="manual">Manual</option>
                    <option value="automatico">Automático</option>
                  </select>
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Precio Normal/Día (S/)</label>
                  <input className="form-input" type="number" step="0.01" value={form.base_price_per_day} onChange={e => updateField('base_price_per_day', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio Plus/Día (S/)</label>
                  <input className="form-input" type="number" step="0.01" value={form.plus_plan_price} onChange={e => updateField('plus_plan_price', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio Libre/Día (S/)</label>
                  <input className="form-input" type="number" step="0.01" value={form.libre_plan_price} onChange={e => updateField('libre_plan_price', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Garantía (S/)</label>
                  <input className="form-input" type="number" step="0.01" value={form.guarantee_amount} onChange={e => updateField('guarantee_amount', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reserva mínima (S/)</label>
                  <input className="form-input" type="number" step="0.01" value={form.reservation_amount} onChange={e => updateField('reservation_amount', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Venc. SOAT</label>
                  <input className="form-input" type="date" value={form.soat_expiry} onChange={e => updateField('soat_expiry', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Venc. Seguro</label>
                  <input className="form-input" type="date" value={form.insurance_expiry} onChange={e => updateField('insurance_expiry', e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{marginTop: 12}}>
                <label className="form-label">Foto del Vehículo</label>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 120, height: 80, borderRadius: 8, overflow: 'hidden', background: '#F1F5F9', border: '2px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form.photo_url || (form.brand && form.model) ? (
                      <img 
                        src={getVehiclePhoto(form)} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/120x80?text=Subir+Foto'; }}
                      />
                    ) : <span style={{fontSize:10, color:'#94a3b8', fontWeight: 600}}>SIN FOTO</span>}
                  </div>
                  <input type="file" className="form-input" accept="image/*" onChange={e => handleFileUpload(e, 'photo_url')} />
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editingVehicle ? 'Actualizar Vehículo' : 'Crear Vehículo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

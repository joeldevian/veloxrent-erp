import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import { vehicleService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, RefreshCw, Trash2, Eye, Edit, X } from 'lucide-react';
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
  const [filter, setFilter] = useState({ type: '', status: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState(emptyVehicle);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadVehicles(); }, [filter]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.type) params.type = filter.type;
      if (filter.status) params.status = filter.status;
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
    // Fallback mapping based on folder content
    const brand = v.brand?.trim().replace(/\s+/g, '_');
    const model = v.model?.trim().replace(/\s+/g, '_');
    return `/flota_cars/${brand}_${model}.png`;
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
          <select value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
            <option value="">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="alquilado">Alquilado</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="fuera_de_servicio">Fuera de servicio</option>
          </select>
          <button className="btn btn-reload" onClick={loadVehicles}><RefreshCw size={16} /></button>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Nuevo Vehículo
          </button>
        )}
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Placa</th>
              <th>Tipo</th>
              <th>Precio/Día</th>
              <th>Km Actual</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>Cargando...</td></tr>
            ) : vehicles.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#757575' }}>No hay vehículos registrados</td></tr>
            ) : (
              vehicles.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 60, height: 40, borderRadius: 6, overflow: 'hidden', background: '#f5f5f5', border: '1px solid #eee' }}>
                        <img 
                          src={getVehiclePhoto(v)} 
                          alt={v.model} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/60x40?text=No+Photo'; }}
                        />
                      </div>
                      <div>
                        <strong>{v.brand} {v.model}</strong><br/>
                        <span style={{ fontSize: 12, color: '#757575' }}>{v.year} · {v.color}</span>
                      </div>
                    </div>
                  </td>
                  <td><strong>{v.plate}</strong></td>
                  <td style={{textTransform:'capitalize'}}>{v.type}</td>
                  <td>S/ {parseFloat(v.base_price_per_day).toFixed(2)}</td>
                  <td>{v.current_km?.toLocaleString()} km</td>
                  <td><span className={`badge ${STATUS_MAP[v.status] || 'badge-gray'}`}>{v.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      {isAdmin && <button className="btn-icon btn-dark" onClick={() => openEdit(v)} title="Editar"><Edit size={14} color="white"/></button>}
                      {isAdmin && <button className="btn-delete" onClick={() => handleDelete(v.id)} title="Desactivar"><Trash2 size={14}/></button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth:720}}>
            <div className="modal-header">
              <h2 className="modal-title">{editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
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
                  <div style={{ width: 120, height: 80, borderRadius: 8, overflow: 'hidden', background: '#f8fafc', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form.photo_url || (form.brand && form.model) ? (
                      <img 
                        src={getVehiclePhoto(form)} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/120x80?text=Subir+Foto'; }}
                      />
                    ) : <span style={{fontSize:10, color:'#94a3b8'}}>Sin foto</span>}
                  </div>
                  <input type="file" className="form-input" accept="image/*" onChange={e => handleFileUpload(e, 'photo_url')} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editingVehicle ? 'Actualizar' : 'Crear Vehículo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

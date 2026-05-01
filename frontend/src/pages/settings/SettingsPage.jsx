import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import { taxService, userService } from '../../services/api';
import { Save, Plus, UserCheck, UserX, X, Settings, Users, Shield, User, Edit2, Key, Trash2 } from 'lucide-react';
import { Toast, showAlert, showConfirm } from '../../utils/alert';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('tax');
  const [taxConfig, setTaxConfig] = useState({
    ruc: '', business_name: '', fiscal_address: '', igv_rate: 18,
    invoice_series: 'F001', receipt_series: 'B001', pse_provider: 'nubefact',
    pse_api_url: '', certificate_expiry: ''
  });
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ full_name: '', email: '', password: '', role: 'operator', photo_url: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'tax') loadTaxConfig();
    else loadUsers();
  }, [activeTab]);

  const loadTaxConfig = async () => {
    try {
      setLoading(true);
      const res = await taxService.getConfig();
      if (res.data.data) {
        setTaxConfig(prev => ({ ...prev, ...res.data.data, certificate_expiry: res.data.data.certificate_expiry || '' }));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getAll();
      setUsers(res.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const saveTaxConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await taxService.updateConfig(taxConfig);
      setMessage('✅ Configuración guardada exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error al guardar: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const saveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...userForm };
      if (!dataToSave.password) delete dataToSave.password;

      if (editingUser) {
        await userService.update(editingUser.id, dataToSave);
      } else {
        await userService.create(dataToSave);
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ full_name: '', email: '', password: '', role: 'operator', photo_url: '' });
      loadUsers();
      Toast.fire({ icon: 'success', title: 'Usuario guardado' });
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al guardar usuario', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEditUser = (u) => {
    setEditingUser(u);
    setUserForm({ full_name: u.full_name, email: u.email, password: '', role: u.role, photo_url: u.photo_url || '' });
    setShowUserModal(true);
  };

  const toggleUser = async (id, isActive) => {
    const action = isActive ? 'desactivar' : 'activar';
    if (!await showConfirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} este usuario?`)) return;
    try {
      if (isActive) {
        await userService.deactivate(id);
      } else {
        await userService.update(id, { is_active: true });
      }
      loadUsers();
      Toast.fire({ icon: 'success', title: `Usuario ${isActive ? 'desactivado' : 'activado'}` });
    } catch (e) {
      showAlert('Error al actualizar usuario', 'error');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUserForm(p => ({ ...p, photo_url: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const updateTax = (field, value) => setTaxConfig(prev => ({ ...prev, [field]: value }));

  return (
    <div className="main-content">
      <TopBar title="Configuración del Sistema" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={`btn ${activeTab === 'tax' ? 'btn-primary' : 'btn-dark'}`} onClick={() => setActiveTab('tax')}>
          <Settings size={16} /> Config. Tributaria
        </button>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-dark'}`} onClick={() => setActiveTab('users')}>
          <Users size={16} /> Usuarios del Sistema
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#757575' }}>Cargando...</div>
      ) : activeTab === 'tax' ? (
        <div className="data-table-container" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={20} color="#2e7d32" /> Configuración Tributaria — SUNAT
          </h3>

          {message && (
            <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: message.startsWith('✅') ? 'rgba(0,200,83,0.1)' : 'rgba(229,57,53,0.1)', color: message.startsWith('✅') ? '#1b5e20' : '#c62828', fontSize: 14, fontWeight: 600 }}>
              {message}
            </div>
          )}

          <form onSubmit={saveTaxConfig}>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">RUC</label>
                <input className="form-input" value={taxConfig.ruc} onChange={e => updateTax('ruc', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Razón Social</label>
                <input className="form-input" value={taxConfig.business_name} onChange={e => updateTax('business_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tasa IGV (%)</label>
                <input className="form-input" type="number" step="0.01" value={taxConfig.igv_rate} onChange={e => updateTax('igv_rate', parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Dirección Fiscal</label>
              <input className="form-input" value={taxConfig.fiscal_address} onChange={e => updateTax('fiscal_address', e.target.value)} />
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Serie Factura</label>
                <input className="form-input" value={taxConfig.invoice_series} onChange={e => updateTax('invoice_series', e.target.value)} placeholder="F001" />
              </div>
              <div className="form-group">
                <label className="form-label">Serie Boleta</label>
                <input className="form-input" value={taxConfig.receipt_series} onChange={e => updateTax('receipt_series', e.target.value)} placeholder="B001" />
              </div>
              <div className="form-group">
                <label className="form-label">Proveedor PSE</label>
                <input className="form-input" value={taxConfig.pse_provider} onChange={e => updateTax('pse_provider', e.target.value)} disabled />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">URL API Nubefact</label>
                <input className="form-input" value={taxConfig.pse_api_url} onChange={e => updateTax('pse_api_url', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Venc. Certificado Digital</label>
                <input className="form-input" type="date" value={taxConfig.certificate_expiry} onChange={e => updateTax('certificate_expiry', e.target.value)} />
              </div>
            </div>
            <div style={{ padding: '12px 0', borderRadius: 8, marginTop: 8, fontSize: 13, color: '#757575' }}>
              ⚠️ La clave API de Nubefact se configura únicamente desde las variables de entorno del servidor (NUBEFACT_API_TOKEN) por seguridad. Nunca se expone en el frontend.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => { setEditingUser(null); setUserForm({ full_name: '', email: '', password: '', role: 'operator', photo_url: '' }); setShowUserModal(true); }}>
              <Plus size={16} /> Nuevo Usuario
            </button>
          </div>

          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {users.map(u => (
              <div key={u.id} style={{ background: 'white', borderRadius: 16, padding: 24, display: 'flex', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                {/* Left part: Avatar and details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', border: '2px solid #e2e8f0' }}>
                    {u.photo_url ? (
                      <img src={u.photo_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : u.full_name === 'Admin Principal' ? (
                      <img src="/user/administrador.png" alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : u.full_name === 'Operador Turno Mañana' ? (
                      <img src="/user/operador_uno.png" alt="Operador" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ background: '#3b4a6b', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#212121', marginBottom: 4 }}>{u.full_name}</div>
                  <div style={{ fontSize: 13, color: '#757575', marginBottom: 12 }}>{u.email}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-green'}`}>
                      {u.role === 'admin' ? 'Administrador' : 'Operador'}
                    </span>
                    {!u.is_active && <span className="badge badge-red">Inactivo</span>}
                  </div>
                </div>

                {/* Right part: Action buttons (vertical stack) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginLeft: 16, justifyContent: 'center' }}>
                  <button className="btn-icon" style={{ background: '#FFA500', color: 'white', borderRadius: '50%', width: 36, height: 36, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={() => openEditUser(u)} title="Editar Usuario">
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon" style={{ background: '#757575', color: 'white', borderRadius: '50%', width: 36, height: 36, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={() => openEditUser(u)} title="Cambiar Contraseña">
                    <Key size={16} />
                  </button>
                  <button className="btn-icon" style={{ background: u.is_active ? '#e53935' : '#4CAF50', color: 'white', borderRadius: '50%', width: 36, height: 36, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={() => toggleUser(u.id, u.is_active)} title={u.is_active ? 'Desactivar' : 'Activar'}>
                    {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showUserModal && (
            <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-header">
                  <h2 className="modal-title">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                  <button className="modal-close" onClick={() => setShowUserModal(false)}><X size={20} /></button>
                </div>
                <form onSubmit={saveUser}>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo *</label>
                    <input className="form-input" required value={userForm.full_name} onChange={e => setUserForm(p => ({ ...p, full_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" required value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraseña {editingUser ? '(dejar en blanco para no cambiar)' : '*'}</label>
                    <input className="form-input" type="password" required={!editingUser} minLength={6} value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} placeholder={editingUser ? '••••••••' : ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rol</label>
                    <select className="form-select" value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
                      <option value="operator">Operador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Foto de Perfil</label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {userForm.photo_url && (
                        <img src={userForm.photo_url} alt="Preview" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
                      )}
                      <input type="file" className="form-input" accept="image/*" onChange={handlePhotoChange} />
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setShowUserModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Guardando...' : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import { taxService, userService } from '../../services/api';
import { Save, Plus, UserCheck, UserX, X, Settings, Users, Shield, User, Edit2, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import { Toast, showAlert, showConfirm } from '../../utils/alert';

const TAX_TABS = ['tax', 'users'];

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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (activeTab === 'tax') loadTaxConfig();
    else loadUsers();
  }, [activeTab]);

  const loadTaxConfig = async () => {
    try {
      setLoading(true);
      const res = await taxService.getConfig();
      if (res.data.data) setTaxConfig(prev => ({ ...prev, ...res.data.data, certificate_expiry: res.data.data.certificate_expiry || '' }));
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
    try {
      await taxService.updateConfig(taxConfig);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      showAlert('Error al guardar: ' + (err.response?.data?.message || err.message), 'error');
    } finally { setSaving(false); }
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
      Toast.fire({ icon: 'success', title: editingUser ? 'Usuario actualizado' : 'Usuario creado' });
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al guardar', 'error');
    } finally { setSaving(false); }
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
      if (isActive) { await userService.deactivate(id); }
      else { await userService.update(id, { is_active: true }); }
      loadUsers();
      Toast.fire({ icon: 'success', title: `Usuario ${isActive ? 'desactivado' : 'activado'}` });
    } catch (e) { showAlert('Error al actualizar usuario', 'error'); }
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

  const getUserAvatar = (u) => {
    if (u.photo_url) return <img src={u.photo_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    if (u.full_name === 'Admin Principal') return <img src="/user/administrador.png" alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    if (u.full_name === 'Operador Turno Mañana') return <img src="/user/operador_uno.png" alt="Operador" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    return (
      <div style={{ width: '100%', height: '100%', background: '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <User size={36} color="#94A3B8" />
      </div>
    );
  };

  const certDaysLeft = taxConfig.certificate_expiry
    ? Math.ceil((new Date(taxConfig.certificate_expiry) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="main-content">
      <TopBar title="Configuración del Sistema" />

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 32 }}>
        <button onClick={() => setActiveTab('tax')} style={{ padding: '14px 28px', background: 'none', border: 'none', borderBottom: `3px solid ${activeTab === 'tax' ? '#22C55E' : 'transparent'}`, color: activeTab === 'tax' ? '#0F172A' : '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} /> Config. Tributaria
        </button>
        <button onClick={() => setActiveTab('users')} style={{ padding: '14px 28px', background: 'none', border: 'none', borderBottom: `3px solid ${activeTab === 'users' ? '#22C55E' : 'transparent'}`, color: activeTab === 'users' ? '#0F172A' : '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} /> Usuarios del Sistema
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94A3B8' }}>Cargando configuración...</div>
      ) : activeTab === 'tax' ? (

        /* ===== PESTAÑA TRIBUTARIA ===== */
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={20} color="#22C55E" /> Datos de la Empresa (SUNAT)
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 28 }}>Información utilizada en todos los comprobantes electrónicos emitidos.</p>

            {saved && (
              <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={18} /> Configuración guardada exitosamente.
              </div>
            )}

            <form onSubmit={saveTaxConfig}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>RUC *</label>
                  <input className="form-input" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16 }} value={taxConfig.ruc} onChange={e => updateTax('ruc', e.target.value)} placeholder="20XXXXXXXXX" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Razón Social *</label>
                  <input className="form-input" value={taxConfig.business_name} onChange={e => updateTax('business_name', e.target.value)} placeholder="AutoRent S.A.C." />
                </div>
              </div>

              <div className="form-group" style={{ margin: '0 0 16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Dirección Fiscal *</label>
                <input className="form-input" value={taxConfig.fiscal_address} onChange={e => updateTax('fiscal_address', e.target.value)} placeholder="Jr. Lima 123, Ayacucho" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16, background: '#F8FAFC', padding: 16, borderRadius: 8 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Tasa IGV (%)</label>
                  <input className="form-input" type="number" step="0.01" value={taxConfig.igv_rate} onChange={e => updateTax('igv_rate', parseFloat(e.target.value))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Serie Factura</label>
                  <input className="form-input" style={{ fontFamily: 'monospace', fontWeight: 700 }} value={taxConfig.invoice_series} onChange={e => updateTax('invoice_series', e.target.value)} placeholder="F001" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Serie Boleta</label>
                  <input className="form-input" style={{ fontFamily: 'monospace', fontWeight: 700 }} value={taxConfig.receipt_series} onChange={e => updateTax('receipt_series', e.target.value)} placeholder="B001" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>URL API Nubefact</label>
                  <input className="form-input" value={taxConfig.pse_api_url} onChange={e => updateTax('pse_api_url', e.target.value)} placeholder="https://api.nubefact.com/..." />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Venc. Certificado</label>
                  <input className="form-input" type="date" value={taxConfig.certificate_expiry} onChange={e => updateTax('certificate_expiry', e.target.value)} />
                </div>
              </div>

              <div style={{ background: '#FEF3C7', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#92400E', marginBottom: 24 }}>
                ⚠️ La clave API de Nubefact se configura en las variables de entorno del servidor (NUBEFACT_API_TOKEN). No se almacena en el frontend por seguridad.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 15 }} disabled={saving}>
                  <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </form>
          </div>

          {/* Panel lateral de estado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#0F172A', borderRadius: 12, padding: 24, color: 'white' }}>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Estado de Conexión</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, background: '#22C55E', borderRadius: '50%', boxShadow: '0 0 8px #22C55E' }}></div>
                <span style={{ fontWeight: 700, color: 'white' }}>Nubefact Activo</span>
              </div>
              <div style={{ fontSize: 13, color: '#64748B' }}>Servidor de emisión electrónica operativo.</div>
            </div>

            {certDaysLeft !== null && (
              <div style={{ background: certDaysLeft < 30 ? '#FEF2F2' : '#F0FDF4', borderRadius: 12, padding: 24, border: `1px solid ${certDaysLeft < 30 ? '#FECACA' : '#BBF7D0'}` }}>
                <div style={{ fontSize: 12, color: certDaysLeft < 30 ? '#DC2626' : '#16A34A', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {certDaysLeft < 30 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />} Certificado Digital
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A' }}>{certDaysLeft} días</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  {certDaysLeft < 30 ? '⚠️ Próximo a vencer. Renueva pronto.' : 'Certificado vigente.'}
                </div>
              </div>
            )}

            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Configuración Actual</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>IGV</span>
                  <strong>{taxConfig.igv_rate}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Serie Factura</span>
                  <strong style={{ fontFamily: 'monospace' }}>{taxConfig.invoice_series}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Serie Boleta</span>
                  <strong style={{ fontFamily: 'monospace' }}>{taxConfig.receipt_series}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Proveedor PSE</span>
                  <strong>Nubefact</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      ) : (

        /* ===== PESTAÑA USUARIOS ===== */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Gestión de Usuarios</h3>
              <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>{users.length} usuario(s) registrado(s) en el sistema.</p>
            </div>
            <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => { setEditingUser(null); setUserForm({ full_name: '', email: '', password: '', role: 'operator', photo_url: '' }); setShowUserModal(true); }}>
              <Plus size={16} /> Nuevo Usuario
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {users.map(u => (
              <div key={u.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                {/* Header de la card */}
                <div style={{ background: '#0F172A', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid #334155' }}>
                    {getUserAvatar(u)}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{u.full_name}</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{u.email}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-green'}`}>
                        {u.role === 'admin' ? 'Administrador' : 'Operador'}
                      </span>
                      {!u.is_active && <span className="badge badge-red">Inactivo</span>}
                    </div>
                  </div>
                </div>
                {/* Footer con acciones */}
                <div style={{ padding: 16, display: 'flex', gap: 10 }}>
                  <button className="btn btn-outline" style={{ flex: 1, fontSize: 13, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => openEditUser(u)}>
                    <Edit2 size={14} /> Editar
                  </button>
                  <button className="btn btn-outline" style={{ flex: 1, fontSize: 13, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: u.is_active ? '#FEF2F2' : '#F0FDF4', borderColor: u.is_active ? '#FECACA' : '#BBF7D0', color: u.is_active ? '#DC2626' : '#16A34A' }} onClick={() => toggleUser(u.id, u.is_active)}>
                    {u.is_active ? <><UserX size={14} /> Desactivar</> : <><UserCheck size={14} /> Activar</>}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal de usuario */}
          {showUserModal && (
            <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 32 }}>
                <div className="modal-header">
                  <h2 className="modal-title" style={{ fontSize: 20, fontWeight: 800 }}>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                  <button className="modal-close" onClick={() => setShowUserModal(false)}><X size={20} /></button>
                </div>
                <form onSubmit={saveUser} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Nombre Completo *</label>
                    <input className="form-input" required value={userForm.full_name} onChange={e => setUserForm(p => ({ ...p, full_name: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Email *</label>
                    <input className="form-input" type="email" required value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      Contraseña {editingUser ? <span style={{ fontWeight: 400, color: '#94A3B8' }}>(dejar en blanco para no cambiar)</span> : '*'}
                    </label>
                    <input className="form-input" type="password" required={!editingUser} minLength={6} value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} placeholder={editingUser ? '••••••••' : ''} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Rol del Usuario</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {['operator', 'admin'].map(role => (
                        <label key={role} style={{ flex: 1, padding: '12px 16px', border: `2px solid ${userForm.role === role ? '#22C55E' : '#E2E8F0'}`, background: userForm.role === role ? '#DCFCE7' : 'white', borderRadius: 8, cursor: 'pointer', textAlign: 'center', fontWeight: 700, color: userForm.role === role ? '#16A34A' : '#64748B' }}>
                          <input type="radio" name="urole" value={role} checked={userForm.role === role} onChange={() => setUserForm(p => ({...p, role}))} style={{ display: 'none' }} />
                          {role === 'admin' ? 'Administrador' : 'Operador'}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Foto de Perfil</label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {userForm.photo_url && (
                        <img src={userForm.photo_url} alt="Preview" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0' }} />
                      )}
                      <input type="file" className="form-input" accept="image/*" onChange={handlePhotoChange} />
                    </div>
                  </div>
                  <div className="modal-actions" style={{ paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowUserModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px' }} disabled={saving}>
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

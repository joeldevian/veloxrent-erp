import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import { clientService, crmService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, RefreshCw, Search, Eye, Edit, MessageCircle, FileText, X, Phone, Mail, MapPin, Calendar, Briefcase, Car, TrendingUp, AlertTriangle } from 'lucide-react';
import { Toast, showAlert } from '../../utils/alert';

const CLIENT_TYPES = ['local', 'foraneo', 'extranjero', 'corporativo'];
const STATUS_MAP = {
  prospecto: 'badge-gray', activo: 'badge-green', recurrente: 'badge-blue',
  inactivo: 'badge-orange', bloqueado: 'badge-red'
};

const emptyClient = {
  full_name: '', document_type: 'dni', document_number: '', phone: '', email: '',
  client_type: 'local', accommodation_name: '', accommodation_address: '', accommodation_phone: '',
  temporary_address: '', guarantor_full_name: '', guarantor_phone: '', guarantor_document_number: '',
  guarantor_relationship: '', ruc: '', business_name: '', fiscal_address: '', license_years: '', 
  utility_bill_photo_url: '', photo_url: ''
};

export default function ClientList() {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ client_type: '', client_status: '' });
  const [showModal, setShowModal] = useState(false);
  const [viewingClient, setViewingClient] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(emptyClient);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadClients(); }, [filter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const params = { ...filter };
      if (search) params.search = search;
      const res = await clientService.getAll(params);
      setClients(res.data.data || []);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadClients();
  };

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyClient);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingClient(c);
    setForm({ ...emptyClient, ...c });
    setShowModal(true);
  };

  const openProfile = async (id) => {
    try {
      setProfileLoading(true);
      const res = await clientService.getById(id);
      setViewingClient(res.data.data);
    } catch (err) {
      showAlert('Error al cargar perfil', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingClient) {
        await clientService.update(editingClient.id, form);
      } else {
        await clientService.create(form);
      }
      setShowModal(false);
      loadClients();
      Toast.fire({ icon: 'success', title: 'Cliente guardado' });
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateField(field, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const needsGuarantor = ['foraneo', 'extranjero'].includes(form.client_type);
  const needsAccommodation = ['foraneo', 'extranjero'].includes(form.client_type);
  const needsRUC = form.client_type === 'corporativo';
  const needsUtilityBill = form.client_type === 'local';

  return (
    <div className="main-content">
      <TopBar title="Gestión de Clientes" />

      <div className="page-header">
        <div className="filter-bar">
          <form onSubmit={handleSearch} style={{display:'flex',gap:8}}>
            <input placeholder="Buscar nombre, DNI o teléfono..." value={search} onChange={e => setSearch(e.target.value)} style={{width:260}} />
            <button className="btn btn-dark" type="submit"><Search size={16} /></button>
          </form>
          <select value={filter.client_type} onChange={e => setFilter(p => ({...p, client_type: e.target.value}))}>
            <option value="">Todos los tipos</option>
            {CLIENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select value={filter.client_status} onChange={e => setFilter(p => ({...p, client_status: e.target.value}))}>
            <option value="">Estado CRM</option>
            <option value="prospecto">Prospecto</option>
            <option value="activo">Activo</option>
            <option value="recurrente">Recurrente</option>
            <option value="inactivo">Inactivo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
          <button className="btn btn-reload" onClick={loadClients}><RefreshCw size={16} /></button>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Documento</th>
              <th>Contacto</th>
              <th>Tipo</th>
              <th>Estado CRM</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign:'center',padding:40}}>Cargando...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign:'center',padding:40,color:'#757575'}}>No hay clientes registrados</td></tr>
            ) : (
              clients.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {c.photo_url ? (
                          <img src={c.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : c.client_type === 'corporativo' ? (
                          <img src="/customers/empresa.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : ['foraneo', 'extranjero'].includes(c.client_type) ? (
                          <img src="/customers/turista.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img src="/customers/hombre_cliente_uno.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div>
                        <strong style={{ color: '#0F172A' }}>{c.full_name}</strong>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#334155' }}>{c.document_type?.toUpperCase()}: {c.document_number}</td>
                  <td>
                    <div style={{ fontSize: 13, color: '#334155' }}>{c.phone}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{c.email || '—'}</div>
                  </td>
                  <td style={{textTransform:'capitalize', color: '#334155'}}>{c.client_type}</td>
                  <td><span className={`badge ${STATUS_MAP[c.client_status] || 'badge-gray'}`}>{c.client_status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn-icon btn-dark" onClick={() => openProfile(c.id)} title="Ver Ficha 360°">
                        {profileLoading ? <RefreshCw size={14} className="spin" color="white"/> : <Eye size={14} color="white"/>}
                      </button>
                      <button className="btn-icon btn-outline" onClick={() => openEdit(c)} title="Editar"><Edit size={14}/></button>
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth:720,maxHeight:'90vh', padding: 32}}>
            <div className="modal-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #E2E8F0' }}>
              <h2 className="modal-title" style={{ fontSize: 20, fontWeight: 800 }}>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input className="form-input" required value={form.full_name} onChange={e => updateField('full_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Cliente *</label>
                  <select className="form-select" value={form.client_type} onChange={e => updateField('client_type', e.target.value)}>
                    {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Tipo Doc. *</label>
                  <select className="form-select" value={form.document_type} onChange={e => updateField('document_type', e.target.value)}>
                    <option value="dni">DNI</option>
                    <option value="pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nro. Documento *</label>
                  <input className="form-input" required value={form.document_number} onChange={e => updateField('document_number', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono *</label>
                  <input className="form-input" required value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="999999999" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => updateField('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Años de Licencia *</label>
                  <input className="form-input" type="number" required min="0" value={form.license_years} onChange={e => updateField('license_years', e.target.value === '' ? '' : parseInt(e.target.value))} />
                  {form.license_years !== '' && form.license_years < 2 && (
                    <div style={{color:'#EF4444',fontSize:12,marginTop:4,fontWeight:600}}>⚠ Deseable 2+ años. Requiere validación manual.</div>
                  )}
                </div>
                {needsUtilityBill && (
                  <div className="form-group">
                    <label className="form-label">Foto Recibo (Agua o Luz) *</label>
                    <input className="form-input" type="file" accept="image/*" required={!form.utility_bill_photo_url} onChange={e => handleFileUpload(e, 'utility_bill_photo_url')} />
                    {form.utility_bill_photo_url && <div style={{fontSize: 12, color: '#22C55E', marginTop: 4, fontWeight: 600}}>✓ Imagen cargada</div>}
                  </div>
                )}
              </div>

              <div className="form-group" style={{marginTop: 12}}>
                <label className="form-label">Foto del Cliente</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {form.photo_url && (
                    <img src={form.photo_url} alt="Preview" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0' }} />
                  )}
                  <input type="file" className="form-input" accept="image/*" onChange={e => handleFileUpload(e, 'photo_url')} />
                </div>
              </div>

              {needsAccommodation && (
                <>
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,marginTop:8,color:'#334155'}}>Datos de Hospedaje o Domicilio Temporal (Obligatorio)</h3>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label">Hospedaje o Domicilio *</label>
                      <input className="form-input" required={needsAccommodation} value={form.accommodation_name} onChange={e => updateField('accommodation_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Dirección *</label>
                      <input className="form-input" required={needsAccommodation} value={form.accommodation_address} onChange={e => updateField('accommodation_address', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Celular / Teléfono *</label>
                      <input className="form-input" required={needsAccommodation} value={form.accommodation_phone} onChange={e => updateField('accommodation_phone', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {needsGuarantor && (
                <>
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,marginTop:8,color:'#334155'}}>Datos del Garante (Obligatorio)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nombre del Garante *</label>
                      <input className="form-input" required={needsGuarantor} value={form.guarantor_full_name} onChange={e => updateField('guarantor_full_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono del Garante *</label>
                      <input className="form-input" required={needsGuarantor} value={form.guarantor_phone} onChange={e => updateField('guarantor_phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Doc. del Garante *</label>
                      <input className="form-input" required={needsGuarantor} value={form.guarantor_document_number} onChange={e => updateField('guarantor_document_number', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Relación</label>
                      <select className="form-select" value={form.guarantor_relationship} onChange={e => updateField('guarantor_relationship', e.target.value)}>
                        <option value="">Seleccionar</option>
                        <option value="familiar">Familiar</option>
                        <option value="amigo">Amigo</option>
                        <option value="colega">Colega</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {needsRUC && (
                <>
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,marginTop:8,color:'#334155'}}>Datos de Facturación</h3>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label">RUC</label>
                      <input className="form-input" value={form.ruc} onChange={e => updateField('ruc', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Razón Social</label>
                      <input className="form-input" value={form.business_name} onChange={e => updateField('business_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Dir. Fiscal</label>
                      <input className="form-input" value={form.fiscal_address} onChange={e => updateField('fiscal_address', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              <div className="modal-actions" style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editingClient ? 'Actualizar Cliente' : 'Crear Cliente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FICHA 360° */}
      {viewingClient && (
        <div className="modal-overlay" onClick={() => setViewingClient(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 1000, width: '95%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '90vh'}}>
            <div style={{ background: '#0F172A', padding: '32px 40px', position: 'relative', display: 'flex', gap: 24, alignItems: 'center' }}>
              <button className="modal-close" style={{position: 'absolute', top: 24, right: 24}} onClick={() => setViewingClient(null)}>
                <X size={24} color="#94A3B8"/>
              </button>
              
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#F8FAFC', overflow: 'hidden', border: '4px solid #334155', flexShrink: 0 }}>
                {viewingClient.photo_url ? (
                  <img src={viewingClient.photo_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : viewingClient.client_type === 'corporativo' ? (
                  <img src="/customers/empresa.png" alt="Empresa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (['foraneo', 'extranjero'].includes(viewingClient.client_type)) ? (
                  <img src="/customers/turista.png" alt="Turista" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src="/customers/hombre_cliente_uno.png" alt="Local" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              
              <div style={{ color: 'white' }}>
                <h2 style={{fontSize: 28, fontWeight: 800, marginBottom: 4}}>{viewingClient.full_name}</h2>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 14, color: '#94A3B8' }}>
                  <span style={{textTransform:'capitalize'}}>{viewingClient.client_type}</span>
                  <span style={{width: 4, height: 4, background: '#475569', borderRadius: '50%'}}></span>
                  <span className={`badge ${STATUS_MAP[viewingClient.client_status] || 'badge-gray'}`}>{viewingClient.client_status}</span>
                </div>
              </div>

              {/* Stats Rápidos */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 32 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Total Alquilado</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#22C55E' }}>S/ {viewingClient.stats?.total_acumulado || 0}</div>
                </div>
                <div style={{ width: 1, background: '#334155' }}></div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Contratos</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{viewingClient.stats?.total_contratos || 0}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left Column: Details */}
              <div style={{ width: 340, background: '#F8FAFC', borderRight: '1px solid #E2E8F0', padding: 32, overflowY: 'auto' }}>
                <h3 style={{fontSize:14, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 16}}>Datos Personales</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <FileText size={18} color="#94A3B8" style={{ marginTop: 2 }}/>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{viewingClient.document_type?.toUpperCase()}</div>
                      <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 600 }}>{viewingClient.document_number}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Phone size={18} color="#94A3B8" style={{ marginTop: 2 }}/>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>Teléfono</div>
                      <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 600 }}>{viewingClient.phone}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Mail size={18} color="#94A3B8" style={{ marginTop: 2 }}/>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>Email</div>
                      <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 600 }}>{viewingClient.email || '—'}</div>
                    </div>
                  </div>
                </div>

                <h3 style={{fontSize:14, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 16}}>Estado de Documentación</h3>
                <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E2E8F0', padding: 16, marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Licencia Conducir</span>
                    {viewingClient.license_years >= 2 ? (
                      <span className="badge badge-green">Válida ({viewingClient.license_years} años)</span>
                    ) : (
                      <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12}/> Alerta ({viewingClient.license_years} años)</span>
                    )}
                  </div>
                  {viewingClient.utility_bill_photo_url && (
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Recibo de Servicios</span>
                      <a href={viewingClient.utility_bill_photo_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#3B82F6', textDecoration: 'underline' }}>Ver documento adjunto</a>
                    </div>
                  )}
                </div>

                {['foraneo', 'extranjero'].includes(viewingClient.client_type) && (
                  <>
                    <h3 style={{fontSize:14, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 16}}>Hospedaje y Garante</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <MapPin size={18} color="#94A3B8" style={{ marginTop: 2 }}/>
                        <div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>Hospedaje</div>
                          <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 600 }}>{viewingClient.accommodation_name || '—'}</div>
                          <div style={{ fontSize: 13, color: '#64748B' }}>{viewingClient.accommodation_address}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <Users size={18} color="#94A3B8" style={{ marginTop: 2 }}/>
                        <div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>Garante ({viewingClient.guarantor_relationship})</div>
                          <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 600 }}>{viewingClient.guarantor_full_name || '—'}</div>
                          <div style={{ fontSize: 13, color: '#64748B' }}>Telf: {viewingClient.guarantor_phone}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Contracts and Timeline */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
                  <button style={{ flex: 1, padding: 16, background: 'white', border: 'none', borderBottom: '2px solid #22C55E', fontWeight: 700, color: '#0F172A' }}>Historial de Contratos</button>
                  <button style={{ flex: 1, padding: 16, background: '#F8FAFC', border: 'none', borderBottom: '2px solid transparent', fontWeight: 600, color: '#64748B' }}>Timeline CRM (Próximamente)</button>
                </div>
                
                <div style={{ padding: 32, overflowY: 'auto', flex: 1 }}>
                  {viewingClient.contracts?.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: 40 }}>Este cliente aún no tiene contratos registrados.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {viewingClient.contracts?.map(c => (
                        <div key={c.id} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontWeight: 700, color: '#0F172A' }}>Vehículo ID: {c.vehicle_id?.substring(0,8)}</span>
                              <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>Plan {c.plan}</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#64748B', display: 'flex', gap: 16 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14}/> {new Date(c.start_datetime).toLocaleDateString()}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14}/> {c.trip_destination || '—'}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#22C55E', marginBottom: 4 }}>S/ {c.total_amount || 0}</div>
                            <span className={`badge ${STATUS_MAP[c.status] || 'badge-gray'}`}>{c.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

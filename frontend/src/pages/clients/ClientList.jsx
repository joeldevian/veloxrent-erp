import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import { clientService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, RefreshCw, Search, Eye, Edit, MessageCircle, FileText, X } from 'lucide-react';
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
            {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
              <th>Nombre</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th>Tipo</th>
              <th>Estado</th>
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
                  <td><strong>{c.full_name}</strong><br/><span style={{fontSize:12,color:'#757575'}}>{c.email}</span></td>
                  <td>{c.document_type?.toUpperCase()}: {c.document_number}</td>
                  <td>{c.phone}</td>
                  <td style={{textTransform:'capitalize'}}>{c.client_type}</td>
                  <td><span className={`badge ${STATUS_MAP[c.client_status] || 'badge-gray'}`}>{c.client_status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn-icon btn-dark" onClick={() => setViewingClient(c)} title="Ver Perfil Completo"><Eye size={14} color="white"/></button>
                      <button className="btn-icon btn-dark" onClick={() => openEdit(c)} title="Editar"><Edit size={14} color="white"/></button>
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth:720,maxHeight:'90vh'}}>
            <div className="modal-header">
              <h2 className="modal-title">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
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
                    <div style={{color:'#E65100',fontSize:12,marginTop:4,fontWeight:600}}>⚠ Deseable 2+ años. Requiere validación manual.</div>
                  )}
                </div>
                {needsUtilityBill && (
                  <div className="form-group">
                    <label className="form-label">Foto Recibo (Agua o Luz) *</label>
                    <input className="form-input" type="file" accept="image/*" required={!form.utility_bill_photo_url} onChange={e => handleFileUpload(e, 'utility_bill_photo_url')} />
                    {form.utility_bill_photo_url && <div style={{fontSize: 12, color: '#2e7d32', marginTop: 4, fontWeight: 600}}>✓ Imagen cargada correctamente</div>}
                  </div>
                )}
              </div>

              <div className="form-group" style={{marginTop: 12}}>
                <label className="form-label">Foto del Cliente</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {form.photo_url && (
                    <img src={form.photo_url} alt="Preview" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                  )}
                  <input type="file" className="form-input" accept="image/*" onChange={e => handleFileUpload(e, 'photo_url')} />
                </div>
              </div>

              {needsAccommodation && (
                <>
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,marginTop:8,color:'#424242'}}>Datos de Hospedaje o Domicilio Temporal (Obligatorio)</h3>
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
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,marginTop:8,color:'#424242'}}>Datos del Garante (Obligatorio)</h3>
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
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,marginTop:8,color:'#424242'}}>Datos de Facturación</h3>
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

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editingClient ? 'Actualizar' : 'Crear Cliente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA VER PERFIL COMPLETO */}
      {viewingClient && (
        <div className="modal-overlay" onClick={() => setViewingClient(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 720, position: 'relative'}}>
            <button className="modal-close" style={{position: 'absolute', top: 24, right: 24, zIndex: 10}} onClick={() => setViewingClient(null)}>
              <X size={24} color="#757575"/>
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, marginTop: 12 }}>
              <div style={{ width: 140, height: 140, borderRadius: '50%', background: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', border: '4px solid white' }}>
                {viewingClient.photo_url ? (
                  <img src={viewingClient.photo_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : viewingClient.client_type === 'corporativo' ? (
                  <img src="/customers/empresa.png" alt="Empresa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (['foraneo', 'extranjero'].includes(viewingClient.client_type)) ? (
                  <img src="/customers/turista.png" alt="Turista" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : viewingClient.client_type === 'local' ? (
                  <img src="/customers/hombre_cliente_uno.png" alt="Local" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50" fill="#f0f2f5"/>
                    <circle cx="50" cy="38" r="18" fill="#3b4a6b"/>
                    <path d="M 24 84 C 24 62, 34 56, 50 56 C 66 56, 76 62, 76 84" fill="#3b4a6b"/>
                  </svg>
                )}
              </div>
              <h2 style={{fontSize: 26, fontWeight: 800, marginTop: 16, color: '#212121', letterSpacing: '-0.5px'}}>{viewingClient.full_name}</h2>
              <div style={{ color: '#757575', fontSize: 15, display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <span style={{textTransform:'capitalize', fontWeight: 600}}>{viewingClient.client_type}</span>
                <span style={{width: 4, height: 4, background: '#ccc', borderRadius: '50%'}}></span>
                <span className={`badge ${STATUS_MAP[viewingClient.client_status] || 'badge-gray'}`}>{viewingClient.client_status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <h3 style={{fontSize:15, fontWeight: 700, marginBottom: 12, color: '#424242', borderBottom: '1px solid #eee', paddingBottom: 8}}>Datos Personales</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14}}>
                  <div><span style={{color: '#757575'}}>{viewingClient.document_type?.toUpperCase()}:</span> <strong>{viewingClient.document_number}</strong></div>
                  <div><span style={{color: '#757575'}}>Teléfono:</span> <strong>{viewingClient.phone}</strong></div>
                  <div><span style={{color: '#757575'}}>Email:</span> <strong>{viewingClient.email || '—'}</strong></div>
                  <div><span style={{color: '#757575'}}>Años de Licencia:</span> <strong>{viewingClient.license_years || '—'}</strong></div>
                </div>
              </div>

              {['foraneo', 'extranjero'].includes(viewingClient.client_type) && (
                <div style={{ flex: '1 1 300px' }}>
                  <h3 style={{fontSize:15, fontWeight: 700, marginBottom: 12, color: '#424242', borderBottom: '1px solid #eee', paddingBottom: 8}}>Hospedaje y Garante</h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14}}>
                    <div><span style={{color: '#757575'}}>Hospedaje:</span> <strong>{viewingClient.accommodation_name || '—'}</strong></div>
                    <div><span style={{color: '#757575'}}>Dir. Hospedaje:</span> <strong>{viewingClient.accommodation_address || '—'}</strong></div>
                    <div><span style={{color: '#757575'}}>Telf. Hospedaje:</span> <strong>{viewingClient.accommodation_phone || '—'}</strong></div>
                    <div style={{height: 1, background: '#eee', margin: '4px 0'}}></div>
                    <div><span style={{color: '#757575'}}>Garante:</span> <strong>{viewingClient.guarantor_full_name || '—'}</strong></div>
                    <div><span style={{color: '#757575'}}>Telf. Garante:</span> <strong>{viewingClient.guarantor_phone || '—'}</strong></div>
                    <div><span style={{color: '#757575'}}>Doc. Garante:</span> <strong>{viewingClient.guarantor_document_number || '—'}</strong></div>
                  </div>
                </div>
              )}

              {viewingClient.client_type === 'corporativo' && (
                <div style={{ flex: '1 1 300px' }}>
                  <h3 style={{fontSize:15, fontWeight: 700, marginBottom: 12, color: '#424242', borderBottom: '1px solid #eee', paddingBottom: 8}}>Datos Facturación</h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14}}>
                    <div><span style={{color: '#757575'}}>RUC:</span> <strong>{viewingClient.ruc || '—'}</strong></div>
                    <div><span style={{color: '#757575'}}>Razón Social:</span> <strong>{viewingClient.business_name || '—'}</strong></div>
                    <div><span style={{color: '#757575'}}>Dir. Fiscal:</span> <strong>{viewingClient.fiscal_address || '—'}</strong></div>
                  </div>
                </div>
              )}
            </div>

            {viewingClient.utility_bill_photo_url && (
              <div style={{marginTop: 32}}>
                <h3 style={{fontSize:15, fontWeight: 700, marginBottom: 12, color: '#424242', borderBottom: '1px solid #eee', paddingBottom: 8}}>Recibo de Agua o Luz</h3>
                <div style={{background: '#f5f5f5', padding: 12, borderRadius: 8, textAlign: 'center'}}>
                  <img src={viewingClient.utility_bill_photo_url} alt="Recibo" style={{maxHeight: 300, maxWidth: '100%', borderRadius: 4, objectFit: 'contain'}} />
                </div>
              </div>
            )}

            <div className="modal-actions" style={{marginTop: 32}}>
              <button className="btn btn-primary" onClick={() => setViewingClient(null)}>Cerrar Ficha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

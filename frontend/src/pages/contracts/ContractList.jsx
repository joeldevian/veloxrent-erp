import TopBar from '../../components/TopBar';
import FuelSelector from '../../components/FuelSelector';
import { useState, useEffect, useMemo } from 'react';
import { contractService, vehicleService, clientService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, RefreshCw, CheckCircle, X, PlayCircle, StopCircle, AlertTriangle, Eye, FileText, ChevronRight, ChevronLeft, MapPin, Calendar, Clock, Car } from 'lucide-react';
import { Toast, showAlert, showConfirm, showPrompt } from '../../utils/alert';

const STATUS_MAP = { pending:'badge-orange', confirmed:'badge-blue', active:'badge-green', closed:'badge-gray', cancelled:'badge-red', incident:'badge-red' };
const STATUS_LABELS = { pending:'Pendiente', confirmed:'Confirmada', active:'Activo', closed:'Cerrado', cancelled:'Cancelado', incident:'Incidencia' };

const TABS = [
  { id: '', label: 'Todos' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'active', label: 'Activos' },
  { id: 'closed', label: 'Cerrados' },
  { id: 'cancelled', label: 'Cancelados' }
];

export default function ContractList() {
  const { isAdmin } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  
  const [showOpen, setShowOpen] = useState(null);
  const [showClose, setShowClose] = useState(null);
  const [viewingContract, setViewingContract] = useState(null);
  
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({ client_id:'', vehicle_id:'', plan:'normal', start_datetime:'', end_datetime_planned:'', trip_destination:'', reservation_paid_amount:0, payment_method_reservation:'cash', operation_code:'', policies_accepted:false });
  const [openForm, setOpenForm] = useState({ km_start:'', fuel_level_start:'lleno', photo_start_url:'', policies_accepted:true, policies_version:'1.0' });
  const [closeForm, setCloseForm] = useState({ km_end:'', fuel_level_end:'lleno', photo_end_url:'', voucher_type:'receipt', payment_method_final:'cash', incident_charge:0, client_ruc:'', client_business_name:'', client_fiscal_address:'' });
  
  const [costPreview, setCostPreview] = useState(null);

  useEffect(() => { 
    loadContracts(); 
    const interval = setInterval(() => { loadContracts(true); }, 15000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadContracts = async (silent = false) => {
    try { 
      if (!silent) setLoading(true); 
      const params = {}; 
      if(activeTab) params.status = activeTab; 
      const res = await contractService.getAll(params); 
      setContracts(res.data.data||[]); 
    } catch(e){console.error(e);} finally{ if(!silent) setLoading(false); }
  };

  const loadFormData = async () => {
    try {
      const [vRes,cRes] = await Promise.all([vehicleService.getAll({status:'disponible'}), clientService.getAll()]);
      setVehicles(vRes.data.data||[]); setClients(cRes.data.data||[]);
    } catch(e){console.error(e);}
  };

  const calculateDays = (start, end) => {
    if(!start || !end) return 0;
    const s = new Date(start); const e = new Date(end);
    if(e <= s) return 0;
    const diffTime = Math.abs(e - s);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const estimatedCost = useMemo(() => {
    if(!createForm.vehicle_id || !createForm.start_datetime || !createForm.end_datetime_planned) return 0;
    const v = vehicles.find(x => x.id === createForm.vehicle_id);
    if(!v) return 0;
    const days = calculateDays(createForm.start_datetime, createForm.end_datetime_planned);
    const rate = createForm.plan === 'plus' ? v.plus_plan_price : createForm.plan === 'libre' ? v.libre_plan_price : v.base_price_per_day;
    return days * parseFloat(rate || 0);
  }, [createForm, vehicles]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { 
      await contractService.create(createForm); 
      setShowCreate(false); 
      setStep(1);
      loadContracts(); 
      Toast.fire({ icon: 'success', title: 'Reserva creada' }); 
    } catch(err){ showAlert(err.response?.data?.message||'Error al crear', 'error'); } finally { setSaving(false); }
  };

  const handleConfirm = async (id) => {
    try { await contractService.confirm(id); loadContracts(); Toast.fire({ icon: 'success', title: 'Confirmada' }); } catch(e){ showAlert('Error', 'error'); }
  };

  const handleOpen = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await contractService.open(showOpen.id, openForm); setShowOpen(null); loadContracts(); Toast.fire({ icon: 'success', title: 'Contrato abierto' }); } catch(err){ showAlert('Error al abrir', 'error'); } finally { setSaving(false); }
  };

  const handleClose = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await contractService.close(showClose.id, closeForm);
      setCostPreview(res.data.data?.calculo || null);
      setShowClose(null); loadContracts();
      if(res.data.data?.calculo) showAlert(`Cerrado. Total: S/ ${res.data.data.calculo.total_amount.toFixed(2)}`, 'success');
    } catch(err){ showAlert('Error al cerrar', 'error'); } finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    const reason = await showPrompt('Motivo de cancelación:');
    if(!reason) return;
    try { await contractService.cancel(id, {reason}); loadContracts(); Toast.fire({ icon: 'success', title: 'Cancelado' }); } catch(e){ showAlert('Error', 'error'); }
  };

  const handleFileUpload = (e, setter, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setter(p => ({ ...p, [field]: reader.result })); };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => { 
    loadFormData(); 
    setCreateForm({ client_id:'', vehicle_id:'', plan:'normal', start_datetime:'', end_datetime_planned:'', trip_destination:'', reservation_paid_amount:0, payment_method_reservation:'cash', operation_code:'', policies_accepted:false }); 
    setStep(1);
    setShowCreate(true); 
  };

  const isLate = (dateStr) => {
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="main-content">
      <TopBar title="Contratos y Reservas" />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
        {TABS.map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: `3px solid ${activeTab === t.id ? '#22C55E' : 'transparent'}`,
              color: activeTab === t.id ? '#0F172A' : '#64748B',
              fontWeight: activeTab === t.id ? 700 : 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, paddingBottom: 12 }}>
          <button className="btn btn-reload" onClick={() => loadContracts()}><RefreshCw size={16}/></button>
          <button className="btn btn-primary" onClick={openCreateModal}><Plus size={16}/> Nueva Reserva</button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th>Fechas y Destino</th>
              <th>Plan / Días</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" style={{textAlign:'center',padding:40}}>Cargando...</td></tr> :
            contracts.length===0 ? <tr><td colSpan="7" style={{textAlign:'center',padding:40,color:'#94A3B8'}}>No hay registros en esta vista.</td></tr> :
            contracts.map(c => {
              const delayed = c.status === 'active' && isLate(c.end_datetime_planned);
              return (
              <tr key={c.id} style={{ background: delayed ? '#FEF2F2' : 'transparent' }}>
                <td>
                  <strong style={{ color: delayed ? '#B91C1C' : '#0F172A' }}>{c.clients?.full_name||'—'}</strong><br/>
                  <span style={{fontSize:12,color:'#64748B'}}>{c.clients?.phone}</span>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{c.vehicles?`${c.vehicles.brand} ${c.vehicles.model}`:'—'}</span><br/>
                  <span style={{fontSize:12,background:'#F1F5F9',padding:'2px 6px',borderRadius:4,fontWeight:700,color:'#475569'}}>{c.vehicles?.plate}</span>
                </td>
                <td>
                  <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12}/> {new Date(c.start_datetime).toLocaleDateString('es-PE')} ➔ {new Date(c.end_datetime_planned).toLocaleDateString('es-PE')}</div>
                  <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}><MapPin size={12}/> {c.trip_destination||'—'}</div>
                </td>
                <td>
                  <div style={{ textTransform: 'capitalize', fontWeight: 600, color: '#0F172A' }}>{c.plan}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{calculateDays(c.start_datetime, c.end_datetime_planned)} días</div>
                </td>
                <td>
                  <span className={`badge ${delayed ? 'badge-red' : STATUS_MAP[c.status]}`}>{delayed ? 'Retraso' : STATUS_LABELS[c.status]}</span>
                </td>
                <td>
                  <strong style={{ color: '#22C55E' }}>{c.total_amount>0?`S/ ${parseFloat(c.total_amount).toFixed(2)}`:'S/ --'}</strong>
                </td>
                <td>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {c.status==='pending' && <button className="btn btn-primary" style={{padding:'6px',fontSize:11}} onClick={()=>handleConfirm(c.id)} title="Confirmar Reserva"><CheckCircle size={14}/></button>}
                    {['pending','confirmed'].includes(c.status) && <button className="btn btn-secondary" style={{padding:'6px',fontSize:11,background:'#3B82F6',borderColor:'#3B82F6'}} onClick={()=>{setOpenForm({km_start:'',fuel_level_start:'lleno',photo_start_url:'',policies_accepted:true,policies_version:'1.0'});setShowOpen(c);}} title="Apertura Presencial"><PlayCircle size={14} color="white"/></button>}
                    {c.status==='active' && <button className="btn btn-dark" style={{padding:'6px',fontSize:11}} onClick={()=>{setCloseForm({km_end:'',fuel_level_end:'lleno',photo_end_url:'',voucher_type:'receipt',payment_method_final:'cash',incident_charge:0,client_ruc:'',client_business_name:'',client_fiscal_address:''});setShowClose(c);}} title="Cierre de Contrato"><StopCircle size={14} color="white"/></button>}
                    <button className="btn btn-outline" style={{padding:'6px',fontSize:11}} onClick={()=>setViewingContract(c)} title="Ver Detalles"><Eye size={14}/></button>
                    {isAdmin && ['pending','confirmed'].includes(c.status) && <button className="btn btn-danger" style={{padding:'6px',fontSize:11}} onClick={()=>handleCancel(c.id)} title="Cancelar"><X size={14} color="white"/></button>}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR RESERVA (STEPPER) */}
      {showCreate && (
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{maxWidth:800, padding: 0, overflow: 'hidden'}}>
            
            <div style={{ background: '#0F172A', padding: '24px 32px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Nueva Reserva</h2>
                <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, margin: 0 }}>Paso {step} de 4</p>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={()=>setShowCreate(false)}><X size={24} color="#94A3B8"/></button>
            </div>

            <div style={{ display: 'flex', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '16px 32px', gap: 12 }}>
              {[1,2,3,4].map(num => (
                <div key={num} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 4, background: step >= num ? '#22C55E' : '#E2E8F0', borderRadius: 2 }}></div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: step >= num ? '#0F172A' : '#94A3B8', textTransform: 'uppercase' }}>
                    {num===1?'Vehículo':num===2?'Cliente':num===3?'Condiciones':'Confirmar'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 32, maxHeight: '60vh', overflowY: 'auto' }}>
              
              {/* PASO 1: VEHICULO Y FECHAS */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Car size={16}/> Vehículo a Alquilar *</label>
                      <select className="form-select" style={{ padding: 12, height: 'auto', fontSize: 15 }} required value={createForm.vehicle_id} onChange={e=>setCreateForm(p=>({...p,vehicle_id:e.target.value}))}>
                        <option value="">Seleccionar vehículo de la flota disponible...</option>
                        {vehicles.map(v=><option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate}) — S/ {v.base_price_per_day} / día</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label">Fecha de Salida *</label>
                      <input className="form-input" type="datetime-local" required value={createForm.start_datetime} onChange={e=>setCreateForm(p=>({...p,start_datetime:e.target.value}))}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fecha Retorno *</label>
                      <input className="form-input" type="datetime-local" required value={createForm.end_datetime_planned} onChange={e=>setCreateForm(p=>({...p,end_datetime_planned:e.target.value}))}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Destino Previsto</label>
                      <input className="form-input" placeholder="Ej. Huanta, Ayacucho" value={createForm.trip_destination} onChange={e=>setCreateForm(p=>({...p,trip_destination:e.target.value}))}/>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Plan de Kilometraje *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {['normal', 'plus', 'libre'].map(p => (
                        <div key={p} 
                             onClick={() => setCreateForm(prev=>({...prev, plan: p}))}
                             style={{ 
                               border: `2px solid ${createForm.plan === p ? '#22C55E' : '#E2E8F0'}`, 
                               background: createForm.plan === p ? '#DCFCE7' : 'white',
                               padding: 16, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s'
                             }}>
                          <div style={{ fontWeight: 800, color: '#0F172A', textTransform: 'capitalize', marginBottom: 4 }}>{p}</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>
                            {p === 'normal' ? '200 km / día. S/ 0.90 km extra.' : p === 'plus' ? '300 km / día. S/ 0.60 km extra.' : 'Kilometraje Ilimitado.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {estimatedCost > 0 && (
                    <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Costo Estimado</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>{calculateDays(createForm.start_datetime, createForm.end_datetime_planned)} días seleccionados</div>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#22C55E' }}>S/ {estimatedCost.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* PASO 2: CLIENTE */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 16, fontWeight: 700 }}>Seleccionar Cliente *</label>
                    <select className="form-select" style={{ padding: 16, fontSize: 16, height: 'auto' }} required value={createForm.client_id} onChange={e=>setCreateForm(p=>({...p,client_id:e.target.value}))}>
                      <option value="">Buscar y seleccionar cliente existente...</option>
                      {clients.map(c=><option key={c.id} value={c.id}>{c.full_name} — {c.document_number} ({c.client_status})</option>)}
                    </select>
                  </div>
                  
                  {createForm.client_id && (() => {
                    const client = clients.find(c => c.id === createForm.client_id);
                    if(!client) return null;
                    return (
                      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: 24, display: 'flex', gap: 24 }}>
                        <div style={{ width: 60, height: 60, background: '#F1F5F9', borderRadius: '50%', overflow: 'hidden' }}>
                          <img src={client.photo_url || '/customers/hombre_cliente_uno.png'} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{client.full_name}</h3>
                          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748B', marginBottom: 12 }}>
                            <span>Telf: {client.phone}</span>
                            <span>Doc: {client.document_number}</span>
                            <span style={{textTransform:'capitalize'}}>Tipo: {client.client_type}</span>
                          </div>
                          {client.client_status === 'bloqueado' && (
                            <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <AlertTriangle size={16}/> Cliente Bloqueado. No se puede alquilar.
                            </div>
                          )}
                          {client.license_years < 2 && client.client_status !== 'bloqueado' && (
                            <div style={{ background: '#FEF3C7', color: '#92400E', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <AlertTriangle size={16}/> Licencia con menos de 2 años. Validar experiencia.
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* PASO 3: CONDICIONES Y PAGO */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="form-row">
                    <div className="form-group" style={{ background: '#F8FAFC', padding: 20, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <label className="form-label" style={{ color: '#0F172A', fontWeight: 700 }}>Abono por Reserva / Adelanto (S/)</label>
                      <input className="form-input" style={{ fontSize: 20, fontWeight: 800, padding: 16, height: 'auto', background: 'white' }} type="number" step="0.01" min="0" value={createForm.reservation_paid_amount} onChange={e=>setCreateForm(p=>({...p,reservation_paid_amount:parseFloat(e.target.value)||0}))}/>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>Ingresa el monto que el cliente está pagando en este momento para asegurar el vehículo.</div>
                    </div>
                  </div>

                  {createForm.reservation_paid_amount > 0 && (
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: 24, borderRadius: 8 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Detalle del Pago</h4>
                      <div className="form-row">
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Método de Pago *</label>
                          <select className="form-select" value={createForm.payment_method_reservation} onChange={e=>setCreateForm(p=>({...p,payment_method_reservation:e.target.value}))}>
                            <option value="cash">Efectivo</option>
                            <option value="yape">Yape</option>
                            <option value="plin">Plin</option>
                            <option value="card_debit">T. Débito</option>
                            <option value="card_credit">T. Crédito</option>
                            <option value="bank_transfer">Transferencia</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Código de Operación</label>
                          <input className="form-input" placeholder="Ej. 123456" value={createForm.operation_code} onChange={e=>setCreateForm(p=>({...p,operation_code:e.target.value}))}/>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#F1F5F9', padding: 16, borderRadius: 8 }}>
                    <input type="checkbox" id="policies" checked={createForm.policies_accepted} onChange={e=>setCreateForm(p=>({...p,policies_accepted:e.target.checked}))} style={{ width: 18, height: 18, marginTop: 2 }} />
                    <label htmlFor="policies" style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, cursor: 'pointer' }}>
                      <strong>Aceptación de Políticas:</strong> El cliente ha leído y acepta los términos y condiciones de alquiler vigentes, incluyendo las políticas de penalidades por retraso, multas, y daños no cubiertos por el seguro.
                    </label>
                  </div>
                </div>
              )}

              {/* PASO 4: CONFIRMACION */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ width: 64, height: 64, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <CheckCircle size={32} color="#22C55E"/>
                    </div>
                    <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>Resumen de la Reserva</h3>
                    <p style={{ color: '#64748B' }}>Por favor verifica que todos los datos sean correctos antes de confirmar.</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, background: '#F8FAFC', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div>
                      <h4 style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Datos del Cliente</h4>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{clients.find(c=>c.id===createForm.client_id)?.full_name}</div>
                      <div style={{ fontSize: 13, color: '#64748B' }}>DNI: {clients.find(c=>c.id===createForm.client_id)?.document_number}</div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Vehículo y Plan</h4>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{vehicles.find(v=>v.id===createForm.vehicle_id)?.brand} {vehicles.find(v=>v.id===createForm.vehicle_id)?.model}</div>
                      <div style={{ fontSize: 13, color: '#64748B', textTransform: 'capitalize' }}>Plan: {createForm.plan}</div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Itinerario</h4>
                      <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 600 }}>{new Date(createForm.start_datetime).toLocaleDateString()} ➔ {new Date(createForm.end_datetime_planned).toLocaleDateString()}</div>
                      <div style={{ fontSize: 13, color: '#64748B' }}>{calculateDays(createForm.start_datetime, createForm.end_datetime_planned)} días · {createForm.trip_destination||'Sin destino definido'}</div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Económico</h4>
                      <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 600 }}>Costo Estimado: S/ {estimatedCost.toFixed(2)}</div>
                      <div style={{ fontSize: 13, color: '#22C55E', fontWeight: 700 }}>Abonado hoy: S/ {createForm.reservation_paid_amount.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div style={{ padding: '24px 32px', background: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
              {step > 1 ? (
                <button className="btn btn-outline" style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={()=>setStep(s=>s-1)}>
                  <ChevronLeft size={16}/> Atrás
                </button>
              ) : (
                <button className="btn btn-outline" onClick={()=>setShowCreate(false)}>Cancelar</button>
              )}

              {step < 4 ? (
                <button className="btn btn-primary" style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#0F172A' }} 
                  disabled={
                    (step===1 && (!createForm.vehicle_id || !createForm.start_datetime || !createForm.end_datetime_planned)) ||
                    (step===2 && !createForm.client_id) ||
                    (step===3 && !createForm.policies_accepted)
                  }
                  onClick={()=>setStep(s=>s+1)}>
                  Continuar <ChevronRight size={16}/>
                </button>
              ) : (
                <button className="btn btn-primary" style={{ fontSize: 16, padding: '12px 32px' }} disabled={saving} onClick={handleCreate}>
                  {saving ? 'Procesando...' : 'Confirmar Reserva'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL APERTURA PRESENCIAL (UI Mejorada) */}
      {showOpen && (
        <div className="modal-overlay" onClick={()=>setShowOpen(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{maxWidth:600}}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: 20, fontWeight: 800 }}>Apertura Presencial</h2>
              <button className="modal-close" onClick={()=>setShowOpen(null)}><X size={20}/></button>
            </div>
            
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #E2E8F0', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayCircle size={24} color="#16A34A"/>
              </div>
              <div>
                <strong style={{ fontSize: 16, color: '#0F172A', display: 'block' }}>{showOpen.clients?.full_name}</strong>
                <span style={{ fontSize: 13, color: '#64748B' }}>{showOpen.vehicles?.brand} {showOpen.vehicles?.model} ({showOpen.vehicles?.plate})</span>
              </div>
            </div>

            <form onSubmit={handleOpen}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kilómetros de salida *</label>
                  <input className="form-input" style={{ fontSize: 18, fontWeight: 700 }} type="number" required value={openForm.km_start} onChange={e=>setOpenForm(p=>({...p,km_start:parseInt(e.target.value)||''}))}/>
                </div>
              </div>
              
              <div className="form-group" style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <FuelSelector label="Nivel de combustible de salida *" value={openForm.fuel_level_start} onChange={v=>setOpenForm(p=>({...p,fuel_level_start:v}))}/>
              </div>
              
              <div className="form-group">
                <label className="form-label">Foto del Tablero (Salida) *</label>
                <div style={{ border: '2px dashed #CBD5E1', padding: 24, borderRadius: 8, textAlign: 'center', background: '#F8FAFC' }}>
                  <input type="file" accept="image/*" required onChange={e => handleFileUpload(e, setOpenForm, 'photo_start_url')} style={{ marginBottom: 12 }} />
                  {openForm.photo_start_url && openForm.photo_start_url.startsWith('data:image') && (
                    <img src={openForm.photo_start_url} alt="Tablero salida" style={{marginTop:8, height:100, borderRadius:8, objectFit: 'contain'}}/>
                  )}
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" className="btn btn-outline" onClick={()=>setShowOpen(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Procesando...':'Confirmar Salida del Vehículo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CIERRE DE CONTRATO (UI Mejorada) */}
      {showClose && (
        <div className="modal-overlay" onClick={()=>setShowClose(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{maxWidth:700, padding: 32}}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: 20, fontWeight: 800 }}>Cierre de Contrato</h2>
              <button className="modal-close" onClick={()=>setShowClose(null)}><X size={20}/></button>
            </div>
            
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #E2E8F0', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, background: '#DBEAFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StopCircle size={24} color="#2563EB"/>
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 16, color: '#0F172A', display: 'block' }}>{showClose.clients?.full_name}</strong>
                <span style={{ fontSize: 13, color: '#64748B' }}>{showClose.vehicles?.brand} {showClose.vehicles?.model} · Plan {showClose.plan}</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#64748B' }}>
                <div>KM Salida: <strong>{showClose.km_start}</strong></div>
                <div>Combustible: <strong>{showClose.fuel_level_start}</strong></div>
              </div>
            </div>

            <form onSubmit={handleClose}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kilómetros de llegada *</label>
                  <input className="form-input" style={{ fontSize: 18, fontWeight: 700 }} type="number" required value={closeForm.km_end} onChange={e=>setCloseForm(p=>({...p,km_end:parseInt(e.target.value)||''}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Cargos Extra / Incidencias (S/)</label>
                  <input className="form-input" style={{ fontSize: 18, fontWeight: 700 }} type="number" step="0.01" value={closeForm.incident_charge} onChange={e=>setCloseForm(p=>({...p,incident_charge:parseFloat(e.target.value)||0}))}/>
                </div>
              </div>
              
              <div className="form-group" style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <FuelSelector label="Nivel de combustible de llegada *" value={closeForm.fuel_level_end} onChange={v=>setCloseForm(p=>({...p,fuel_level_end:v}))}/>
              </div>
              
              <div className="form-group">
                <label className="form-label">Foto del Tablero (Llegada)</label>
                <div style={{ border: '2px dashed #CBD5E1', padding: 16, borderRadius: 8, textAlign: 'center', background: '#F8FAFC' }}>
                  <input type="file" accept="image/*" onChange={e => handleFileUpload(e, setCloseForm, 'photo_end_url')} />
                </div>
              </div>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 24, marginBottom: 16, borderTop: '1px solid #E2E8F0', paddingTop: 24 }}>Emisión de Comprobante</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo Comprobante *</label>
                  <select className="form-select" value={closeForm.voucher_type} onChange={e=>setCloseForm(p=>({...p,voucher_type:e.target.value}))}>
                    <option value="receipt">Boleta Electrónica</option>
                    <option value="invoice">Factura Electrónica</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Método de Pago Final *</label>
                  <select className="form-select" value={closeForm.payment_method_final} onChange={e=>setCloseForm(p=>({...p,payment_method_final:e.target.value}))}>
                    <option value="cash">Efectivo</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                    <option value="card_debit">T. Débito</option>
                    <option value="card_credit">T. Crédito</option>
                    <option value="bank_transfer">Transferencia</option>
                  </select>
                </div>
              </div>
              
              {closeForm.voucher_type==='invoice' && (
                <div className="form-row-3" style={{ background: '#F1F5F9', padding: 16, borderRadius: 8 }}>
                  <div className="form-group"><label className="form-label">RUC *</label><input className="form-input" required value={closeForm.client_ruc} onChange={e=>setCloseForm(p=>({...p,client_ruc:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Razón Social *</label><input className="form-input" required value={closeForm.client_business_name} onChange={e=>setCloseForm(p=>({...p,client_business_name:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Dir. Fiscal *</label><input className="form-input" required value={closeForm.client_fiscal_address} onChange={e=>setCloseForm(p=>({...p,client_fiscal_address:e.target.value}))}/></div>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" className="btn btn-outline" onClick={()=>setShowClose(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0F172A' }} disabled={saving}>{saving?'Procesando...':'Calcular Total y Cerrar Contrato'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

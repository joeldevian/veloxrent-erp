import TopBar from '../../components/TopBar';
import FuelSelector from '../../components/FuelSelector';
import { useState, useEffect } from 'react';
import { contractService, vehicleService, clientService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, RefreshCw, CheckCircle, X, PlayCircle, StopCircle, AlertTriangle, Eye, FileText } from 'lucide-react';
import { Toast, showAlert, showConfirm, showPrompt } from '../../utils/alert';

const STATUS_MAP = { pending:'badge-orange', confirmed:'badge-blue', active:'badge-green', closed:'badge-gray', cancelled:'badge-red', incident:'badge-red' };
const STATUS_LABELS = { pending:'Pendiente', confirmed:'Confirmada', active:'Activo', closed:'Cerrado', cancelled:'Cancelado', incident:'Incidencia' };

export default function ContractList() {
  const { isAdmin } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '' });
  const [showOpen, setShowOpen] = useState(null);
  const [showClose, setShowClose] = useState(null);
  const [viewingContract, setViewingContract] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({ client_id:'', vehicle_id:'', plan:'normal', start_datetime:'', end_datetime_planned:'', trip_destination:'', reservation_paid_amount:0, payment_method_reservation:'cash', operation_code:'' });
  const [openForm, setOpenForm] = useState({ km_start:'', fuel_level_start:'lleno', photo_start_url:'', policies_accepted:true, policies_version:'1.0' });
  const [closeForm, setCloseForm] = useState({ km_end:'', fuel_level_end:'lleno', photo_end_url:'', voucher_type:'receipt', payment_method_final:'cash', incident_charge:0, client_ruc:'', client_business_name:'', client_fiscal_address:'' });
  const [costPreview, setCostPreview] = useState(null);

  useEffect(() => { 
    loadContracts(); 
    const interval = setInterval(() => {
      loadContracts(true); // silent load
    }, 15000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadContracts = async (silent = false) => {
    try { 
      if (!silent) setLoading(true); 
      const params = {}; 
      if(filter.status) params.status=filter.status; 
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

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await contractService.create(createForm); setShowCreate(false); loadContracts(); Toast.fire({ icon: 'success', title: 'Reserva creada' }); } catch(err){ showAlert(err.response?.data?.message||'Error', 'error'); } finally { setSaving(false); }
  };

  const handleConfirm = async (id) => {
    try { await contractService.confirm(id); loadContracts(); Toast.fire({ icon: 'success', title: 'Contrato confirmado' }); } catch(e){ showAlert(e.response?.data?.message||'Error', 'error'); }
  };

  const handleOpen = async (e) => {
    e.preventDefault();
    if(!openForm.km_start && openForm.km_start!==0) return showAlert('Kilómetros de salida obligatorio', 'warning');
    if(!openForm.fuel_level_start) return showAlert('Nivel de combustible obligatorio', 'warning');
    if(!openForm.photo_start_url) return showAlert('Foto del tablero obligatoria', 'warning');
    setSaving(true);
    try { await contractService.open(showOpen.id, openForm); setShowOpen(null); loadContracts(); Toast.fire({ icon: 'success', title: 'Contrato abierto' }); } catch(err){ showAlert(err.response?.data?.message||'Error', 'error'); } finally { setSaving(false); }
  };

  const handleClose = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await contractService.close(showClose.id, closeForm);
      setCostPreview(res.data.data?.calculo || null);
      setShowClose(null); loadContracts();
      if(res.data.data?.calculo) showAlert(`Contrato cerrado. Total: S/ ${res.data.data.calculo.total_amount.toFixed(2)}`, 'success');
    } catch(err){ showAlert(err.response?.data?.message||'Error', 'error'); } finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    const reason = await showPrompt('Motivo de cancelación:');
    if(!reason) return;
    try { await contractService.cancel(id, {reason}); loadContracts(); Toast.fire({ icon: 'success', title: 'Contrato cancelado' }); } catch(e){ showAlert(e.response?.data?.message||'Error', 'error'); }
  };

  const handleFileUpload = (e, setter, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(p => ({ ...p, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => { loadFormData(); setCreateForm({ client_id:'', vehicle_id:'', plan:'normal', start_datetime:'', end_datetime_planned:'', trip_destination:'', reservation_paid_amount:0, payment_method_reservation:'cash', operation_code:'' }); setShowCreate(true); };

  return (
    <div className="main-content">
      <TopBar title="Contratos y Reservas" />
      <div className="page-header">
        <div className="filter-bar">
          <select value={filter.status} onChange={e => setFilter({status:e.target.value})}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn btn-reload" onClick={loadContracts}><RefreshCw size={16}/></button>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}><Plus size={16}/> Nueva Reserva</button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Cliente</th><th>Vehículo</th><th>Plan</th><th>Inicio</th><th>Destino</th><th>Estado</th><th>Total</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="8" style={{textAlign:'center',padding:40}}>Cargando...</td></tr> :
            contracts.length===0 ? <tr><td colSpan="8" style={{textAlign:'center',padding:40,color:'#757575'}}>Sin contratos</td></tr> :
            contracts.map(c => (
              <tr key={c.id}>
                <td><strong>{c.clients?.full_name||'—'}</strong><br/><span style={{fontSize:11,color:'#757575'}}>{c.clients?.phone}</span></td>
                <td>{c.vehicles?`${c.vehicles.brand} ${c.vehicles.model}`:'—'}<br/><span style={{fontSize:11,color:'#757575'}}>{c.vehicles?.plate}</span></td>
                <td style={{textTransform:'capitalize'}}>{c.plan}</td>
                <td>{c.start_datetime?new Date(c.start_datetime).toLocaleDateString('es-PE'):'—'}</td>
                <td>{c.trip_destination||'—'}</td>
                <td><span className={`badge ${STATUS_MAP[c.status]}`}>{STATUS_LABELS[c.status]}</span></td>
                <td>{c.total_amount>0?`S/ ${parseFloat(c.total_amount).toFixed(2)}`:'—'}</td>
                <td>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                    {c.status==='pending' && <button className="btn btn-primary" style={{padding:'5px 8px',fontSize:11}} onClick={()=>handleConfirm(c.id)} title="Confirmar"><CheckCircle size={13}/></button>}
                    {['pending','confirmed'].includes(c.status) && <button className="btn btn-secondary" style={{padding:'5px 8px',fontSize:11}} onClick={()=>{setOpenForm({km_start:'',fuel_level_start:'lleno',photo_start_url:'',policies_accepted:true,policies_version:'1.0'});setShowOpen(c);}} title="Abrir"><PlayCircle size={13}/></button>}
                    {c.status==='active' && <button className="btn btn-dark" style={{padding:'5px 8px',fontSize:11}} onClick={()=>{setCloseForm({km_end:'',fuel_level_end:'lleno',photo_end_url:'',voucher_type:'receipt',payment_method_final:'cash',incident_charge:0,client_ruc:'',client_business_name:'',client_fiscal_address:''});setShowClose(c);}} title="Cerrar"><StopCircle size={13}/></button>}
                    <button className="btn btn-outline" style={{padding:'5px 8px',fontSize:11, color:'#424242', borderColor:'#ccc'}} onClick={()=>setViewingContract(c)} title="Ver Detalles"><Eye size={13}/></button>
                    {isAdmin && ['pending','confirmed'].includes(c.status) && <button className="btn btn-danger" style={{padding:'5px 8px',fontSize:11}} onClick={()=>handleCancel(c.id)} title="Cancelar"><X size={13}/></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR RESERVA */}
      {showCreate && (
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{maxWidth:640}}>
            <div className="modal-header"><h2 className="modal-title">Nueva Reserva</h2><button className="modal-close" onClick={()=>setShowCreate(false)}><X size={20}/></button></div>
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Cliente *</label>
                  <select className="form-select" required value={createForm.client_id} onChange={e=>setCreateForm(p=>({...p,client_id:e.target.value}))}>
                    <option value="">Seleccionar</option>{clients.map(c=><option key={c.id} value={c.id}>{c.full_name} — {c.document_number}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Vehículo *</label>
                  <select className="form-select" required value={createForm.vehicle_id} onChange={e=>setCreateForm(p=>({...p,vehicle_id:e.target.value}))}>
                    <option value="">Seleccionar</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate}) — S/{v.base_price_per_day}/día</option>)}
                  </select></div>
              </div>
              <div className="form-row-3">
                <div className="form-group"><label className="form-label">Plan *</label>
                  <select className="form-select" value={createForm.plan} onChange={e=>setCreateForm(p=>({...p,plan:e.target.value}))}><option value="normal">Normal (200km/día)</option><option value="plus">Plus (300km/día)</option><option value="libre">Libre (Sin límite)</option></select></div>
                <div className="form-group"><label className="form-label">Fecha Salida *</label><input className="form-input" type="datetime-local" required value={createForm.start_datetime} onChange={e=>setCreateForm(p=>({...p,start_datetime:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Fecha Retorno *</label><input className="form-input" type="datetime-local" required value={createForm.end_datetime_planned} onChange={e=>setCreateForm(p=>({...p,end_datetime_planned:e.target.value}))}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Destino del viaje</label><input className="form-input" value={createForm.trip_destination} onChange={e=>setCreateForm(p=>({...p,trip_destination:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Monto de Adelanto / Reserva (S/)</label><input className="form-input" type="number" step="0.01" min="0" value={createForm.reservation_paid_amount} onChange={e=>setCreateForm(p=>({...p,reservation_paid_amount:parseFloat(e.target.value)||0}))}/><div style={{fontSize:11,color:'#757575',marginTop:4}}>Dinero a ingresar ahora a caja (ej. Garantía o abono)</div></div>
              </div>
              
              {createForm.reservation_paid_amount > 0 && (
                <div className="form-row" style={{background: '#f5f5f5', padding: '16px', borderRadius: 8, marginTop: 12}}>
                  <div className="form-group" style={{margin:0}}>
                    <label className="form-label">Método de Pago</label>
                    <select className="form-select" value={createForm.payment_method_reservation} onChange={e=>setCreateForm(p=>({...p,payment_method_reservation:e.target.value}))}>
                      <option value="cash">Efectivo</option><option value="yape">Yape</option><option value="plin">Plin</option><option value="card_debit">T. Débito</option><option value="card_credit">T. Crédito</option><option value="bank_transfer">Transferencia</option>
                    </select>
                  </div>
                  <div className="form-group" style={{margin:0}}>
                    <label className="form-label">Código de Verificación (Opcional)</label>
                    <input className="form-input" placeholder="Nro de operación, voucher..." value={createForm.operation_code} onChange={e=>setCreateForm(p=>({...p,operation_code:e.target.value}))}/>
                  </div>
                </div>
              )}
              
              <div className="modal-actions" style={{marginTop: 24}}><button type="button" className="btn btn-outline" onClick={()=>setShowCreate(false)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Guardando...':'Crear Reserva'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL APERTURA PRESENCIAL */}
      {showOpen && (
        <div className="modal-overlay" onClick={()=>setShowOpen(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{maxWidth:580}}>
            <div className="modal-header"><h2 className="modal-title">Apertura Presencial</h2><button className="modal-close" onClick={()=>setShowOpen(null)}><X size={20}/></button></div>
            <div style={{background:'rgba(0,200,83,0.08)',padding:12,borderRadius:8,marginBottom:16,fontSize:13}}>
              <strong>{showOpen.clients?.full_name}</strong> — {showOpen.vehicles?.brand} {showOpen.vehicles?.model} ({showOpen.vehicles?.plate})
            </div>
            {showOpen.clients && showOpen.clients.license_years < 2 && (
              <div style={{background:'rgba(255,165,0,0.1)',padding:12,borderRadius:8,marginBottom:16,fontSize:13,color:'#E65100',display:'flex',gap:8,alignItems:'center'}}>
                <AlertTriangle size={16}/> Licencia con menos de 2 años de antigüedad. La decisión final es del operador.
              </div>
            )}
            <form onSubmit={handleOpen}>
              <div className="form-group"><label className="form-label">Kilómetros de salida *</label><input className="form-input" type="number" required value={openForm.km_start} onChange={e=>setOpenForm(p=>({...p,km_start:parseInt(e.target.value)||''}))}/></div>
              <div className="form-group"><FuelSelector label="Nivel de combustible de salida *" value={openForm.fuel_level_start} onChange={v=>setOpenForm(p=>({...p,fuel_level_start:v}))}/></div>
              <div className="form-group">
                <label className="form-label">Foto tablero de salida *</label>
                <input type="file" accept="image/*" required onChange={e => handleFileUpload(e, setOpenForm, 'photo_start_url')} className="form-input" style={{padding: '8px'}} />
                {openForm.photo_start_url && openForm.photo_start_url.startsWith('data:image') && <img src={openForm.photo_start_url} alt="Tablero salida" style={{marginTop:8, height:60, borderRadius:4}}/>}
              </div>
              <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={()=>setShowOpen(null)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Abriendo...':'Abrir Contrato'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CIERRE DE CONTRATO */}
      {showClose && (
        <div className="modal-overlay" onClick={()=>setShowClose(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{maxWidth:620}}>
            <div className="modal-header"><h2 className="modal-title">Cierre de Contrato</h2><button className="modal-close" onClick={()=>setShowClose(null)}><X size={20}/></button></div>
            <div style={{background:'rgba(0,200,83,0.08)',padding:12,borderRadius:8,marginBottom:16,fontSize:13}}>
              <strong>{showClose.clients?.full_name}</strong> — {showClose.vehicles?.brand} {showClose.vehicles?.model} ({showClose.vehicles?.plate})<br/>
              Plan: {showClose.plan} · KM salida: {showClose.km_start} · Combustible salida: {showClose.fuel_level_start}
            </div>
            <form onSubmit={handleClose}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Kilómetros de llegada *</label><input className="form-input" type="number" required value={closeForm.km_end} onChange={e=>setCloseForm(p=>({...p,km_end:parseInt(e.target.value)||''}))}/></div>
                <div className="form-group"><label className="form-label">Cargo por incidencia (S/)</label><input className="form-input" type="number" step="0.01" value={closeForm.incident_charge} onChange={e=>setCloseForm(p=>({...p,incident_charge:parseFloat(e.target.value)||0}))}/></div>
              </div>
              <div className="form-group"><FuelSelector label="Nivel de combustible de llegada *" value={closeForm.fuel_level_end} onChange={v=>setCloseForm(p=>({...p,fuel_level_end:v}))}/></div>
              <div className="form-group">
                <label className="form-label">Foto tablero de llegada</label>
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, setCloseForm, 'photo_end_url')} className="form-input" style={{padding: '8px'}} />
                {closeForm.photo_end_url && closeForm.photo_end_url.startsWith('data:image') && <img src={closeForm.photo_end_url} alt="Tablero retorno" style={{marginTop:8, height:60, borderRadius:4}}/>}
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Tipo Comprobante *</label>
                  <select className="form-select" value={closeForm.voucher_type} onChange={e=>setCloseForm(p=>({...p,voucher_type:e.target.value}))}>
                    <option value="receipt">Boleta</option><option value="invoice">Factura</option>
                  </select></div>
                <div className="form-group"><label className="form-label">Método de Pago *</label>
                  <select className="form-select" value={closeForm.payment_method_final} onChange={e=>setCloseForm(p=>({...p,payment_method_final:e.target.value}))}>
                    <option value="cash">Efectivo</option><option value="yape">Yape</option><option value="plin">Plin</option><option value="card_debit">T. Débito</option><option value="card_credit">T. Crédito</option><option value="bank_transfer">Transferencia</option>
                  </select></div>
              </div>
              {closeForm.voucher_type==='invoice' && (
                <div className="form-row-3">
                  <div className="form-group"><label className="form-label">RUC *</label><input className="form-input" required value={closeForm.client_ruc} onChange={e=>setCloseForm(p=>({...p,client_ruc:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Razón Social *</label><input className="form-input" required value={closeForm.client_business_name} onChange={e=>setCloseForm(p=>({...p,client_business_name:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Dir. Fiscal *</label><input className="form-input" required value={closeForm.client_fiscal_address} onChange={e=>setCloseForm(p=>({...p,client_fiscal_address:e.target.value}))}/></div>
                </div>
              )}
              <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={()=>setShowClose(null)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Cerrando...':'Cerrar y Emitir Comprobante'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER DETALLES DEL CONTRATO */}
      {viewingContract && (
        <div className="modal-overlay" onClick={() => setViewingContract(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 720}}>
            <div className="modal-header">
              <h2 className="modal-title" style={{display:'flex',alignItems:'center',gap:8}}><FileText size={20} color="#757575"/> Detalles del Contrato {STATUS_LABELS[viewingContract.status]}</h2>
              <button className="modal-close" onClick={() => setViewingContract(null)}><X size={20}/></button>
            </div>
            
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <h3 style={{fontSize:15, fontWeight: 700, marginBottom: 12, color: '#424242', borderBottom: '1px solid #eee', paddingBottom: 8}}>Datos del Cliente</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14}}>
                  <div><span style={{color: '#757575'}}>Nombre:</span> <strong>{viewingContract.clients?.full_name}</strong></div>
                  <div><span style={{color: '#757575'}}>Documento:</span> <strong>{viewingContract.clients?.document_number}</strong></div>
                  <div><span style={{color: '#757575'}}>Teléfono:</span> <strong>{viewingContract.clients?.phone}</strong></div>
                </div>
                
                <h3 style={{fontSize:15, fontWeight: 700, marginBottom: 12, marginTop: 24, color: '#424242', borderBottom: '1px solid #eee', paddingBottom: 8}}>Vehículo y Plan</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14}}>
                  <div><span style={{color: '#757575'}}>Vehículo:</span> <strong>{viewingContract.vehicles?.brand} {viewingContract.vehicles?.model}</strong></div>
                  <div><span style={{color: '#757575'}}>Placa:</span> <strong>{viewingContract.vehicles?.plate}</strong></div>
                  <div><span style={{color: '#757575'}}>Plan:</span> <strong style={{textTransform:'capitalize'}}>{viewingContract.plan}</strong></div>
                  <div><span style={{color: '#757575'}}>Destino:</span> <strong>{viewingContract.trip_destination || '—'}</strong></div>
                </div>
              </div>

              <div style={{ flex: '1 1 300px' }}>
                <h3 style={{fontSize:15, fontWeight: 700, marginBottom: 12, color: '#424242', borderBottom: '1px solid #eee', paddingBottom: 8}}>Fechas y Estado</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14}}>
                  <div><span style={{color: '#757575'}}>Salida Real:</span> <strong>{viewingContract.start_datetime ? new Date(viewingContract.start_datetime).toLocaleString('es-PE') : '—'}</strong></div>
                  <div><span style={{color: '#757575'}}>Retorno Real:</span> <strong>{viewingContract.end_datetime_real ? new Date(viewingContract.end_datetime_real).toLocaleString('es-PE') : (viewingContract.end_datetime_planned ? new Date(viewingContract.end_datetime_planned).toLocaleString('es-PE') : '—')}</strong></div>
                  <div><span style={{color: '#757575'}}>Estado:</span> <span className={`badge ${STATUS_MAP[viewingContract.status]}`} style={{marginLeft: 8}}>{STATUS_LABELS[viewingContract.status]}</span></div>
                </div>

                <h3 style={{fontSize:15, fontWeight: 700, marginBottom: 12, marginTop: 24, color: '#424242', borderBottom: '1px solid #eee', paddingBottom: 8}}>Kilometraje y Combustible</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14}}>
                  <div><span style={{color: '#757575'}}>KM Salida:</span> <strong>{viewingContract.km_start || '—'}</strong></div>
                  <div><span style={{color: '#757575'}}>KM Llegada:</span> <strong>{viewingContract.km_end || '—'}</strong></div>
                  <div><span style={{color: '#757575'}}>Combustible Salida:</span> <strong style={{textTransform:'capitalize'}}>{viewingContract.fuel_level_start || '—'}</strong></div>
                  <div><span style={{color: '#757575'}}>Combustible Llegada:</span> <strong style={{textTransform:'capitalize'}}>{viewingContract.fuel_level_end || '—'}</strong></div>
                </div>
              </div>
            </div>

            <div style={{marginTop: 32, background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', padding: '16px 24px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h3 style={{fontSize:18, fontWeight: 800, color: '#1b5e20', margin: 0}}>Total Facturado: S/ {parseFloat(viewingContract.total_amount || 0).toFixed(2)}</h3>
                <p style={{fontSize: 13, color: '#2e7d32', margin: '4px 0 0 0'}}>El contrato se encuentra {STATUS_LABELS[viewingContract.status]?.toLowerCase()}.</p>
              </div>
              <FileText size={32} color="#4CAF50" opacity={0.5} />
            </div>

            {viewingContract.notes && viewingContract.notes.includes('web_payment_receipt') && (
              <div style={{marginTop: 24}}>
                <h3 style={{fontSize:15, fontWeight: 700, marginBottom: 12, color: '#424242', borderBottom: '1px solid #eee', paddingBottom: 8}}>Comprobante Adjunto (Vía Web)</h3>
                <img src={JSON.parse(viewingContract.notes).web_payment_receipt} alt="Voucher Web" style={{maxWidth: '100%', maxHeight: 300, borderRadius: 8, objectFit: 'contain', background: '#f5f5f5', padding: 8}} />
              </div>
            )}

            <div className="modal-actions" style={{marginTop: 32}}>
              <button className="btn btn-primary" onClick={() => setViewingContract(null)}>Cerrar Historial</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

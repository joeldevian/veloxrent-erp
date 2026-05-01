import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import { voucherService, taxService, contractService } from '../../services/api';
import { RefreshCw, Download, Mail, FileX, FileText, Code, CheckCircle, Plus, X } from 'lucide-react';
import { Toast, showAlert, showConfirm } from '../../utils/alert';

const TYPE_LABELS = { invoice: 'Factura', receipt: 'Boleta', credit_note: 'Nota Crédito' };
const STATUS_MAP = {
  draft: { label: 'Borrador', class: 'badge-gray' },
  sent: { label: 'Enviado', class: 'badge-blue' },
  accepted: { label: 'Aceptado', class: 'badge-green' },
  rejected: { label: 'Rechazado', class: 'badge-red' },
  cancelled: { label: 'Anulado', class: 'badge-red' }
};

export default function VoucherList() {
  const [vouchers, setVouchers] = useState([]);
  const [taxConfig, setTaxConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '', from: '', to: '' });
  const [igvTotal, setIgvTotal] = useState(0);

  const [showEmitModal, setShowEmitModal] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const [emitForm, setEmitForm] = useState({
    type: 'receipt', contract_id: '', service_description: '', total: '',
    client_ruc: '', client_business_name: '', client_fiscal_address: ''
  });

  useEffect(() => { 
    loadData(); 
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (filter.type) params.type = filter.type;
      if (filter.status) params.status = filter.status;
      if (filter.from) params.from = filter.from;
      if (filter.to) params.to = filter.to;
      
      const [resVouchers, resTax, resContracts] = await Promise.all([
        voucherService.getAll(params),
        taxService.getConfig().catch(() => ({data:{data:null}})),
        contractService.getAll({status: 'closed'}).catch(() => ({data:{data:[]}}))
      ]);
      
      const data = resVouchers.data.data || [];
      setVouchers(data);
      setTaxConfig(resTax.data.data);
      setContracts(resContracts.data.data || []);
      
      const igv = data
        .filter(v => v.status === 'accepted' && v.type !== 'credit_note')
        .reduce((sum, v) => sum + (parseFloat(v.igv_amount) || 0), 0);
      setIgvTotal(igv);
      
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleResend = async (id) => {
    try {
      await voucherService.resend(id);
      Toast.fire({ icon: 'success', title: 'Comprobante reenviado al correo' });
    } catch (e) { showAlert('Error al reenviar', 'error'); }
  };

  const handleCreditNote = async (id) => {
    if (!await showConfirm('¿Emitir nota de crédito para este comprobante?')) return;
    try {
      await voucherService.creditNote(id);
      loadData();
      Toast.fire({ icon: 'success', title: 'Nota de crédito emitida' });
    } catch (e) { showAlert(e.response?.data?.message || 'Error', 'error'); }
  };

  const handleEmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...emitForm };
      
      if(payload.contract_id) {
        const c = contracts.find(x => x.id === payload.contract_id);
        if(c) {
          if(!payload.service_description) payload.service_description = `Servicio de Alquiler Vehicular - ${c.vehicles?.plate}`;
          if(!payload.total) payload.total = c.total_amount;
        }
      }

      if(payload.type === 'receipt') {
        await voucherService.emitReceipt(payload);
      } else {
        await voucherService.emitInvoice(payload);
      }
      
      setShowEmitModal(false);
      loadData();
      Toast.fire({ icon: 'success', title: 'Comprobante emitido y enviado a SUNAT' });
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al emitir', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onContractSelect = (id) => {
    const c = contracts.find(x => x.id === id);
    if(c) {
      setEmitForm(p => ({
        ...p,
        contract_id: id,
        service_description: `Servicio de Alquiler de Vehículo (Placa: ${c.vehicles?.plate}) - Plan ${c.plan}`,
        total: c.total_amount
      }));
    } else {
      setEmitForm(p => ({...p, contract_id: ''}));
    }
  };

  const receiptCount = vouchers.filter(v => v.type === 'receipt' && v.status === 'accepted').length;
  const invoiceCount = vouchers.filter(v => v.type === 'invoice' && v.status === 'accepted').length;
  const creditCount = vouchers.filter(v => v.type === 'credit_note' && v.status === 'accepted').length;
  const totalAmount = vouchers
    .filter(v => v.status === 'accepted' && v.type !== 'credit_note')
    .reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);

  return (
    <div className="main-content">
      <TopBar title="Comprobantes Electrónicos" />

      {/* HEADER DEL MODULO */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, background: '#22C55E', borderRadius: '50%', boxShadow: '0 0 8px #22C55E' }}></div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Conectado a SUNAT vía Nubefact</span>
          </div>
          <div style={{ fontSize: 13, color: '#64748B' }}>Servicio de emisión electrónica activo y sincronizado.</div>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Serie Boletas</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', background: '#F1F5F9', padding: '4px 12px', borderRadius: 6 }}>{taxConfig?.receipt_series || 'B001'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Serie Facturas</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', background: '#F1F5F9', padding: '4px 12px', borderRadius: 6 }}>{taxConfig?.invoice_series || 'F001'}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 24 }}>
        <div className="dash-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Boletas</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{receiptCount}</div>
        </div>
        <div className="dash-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Facturas</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{invoiceCount}</div>
        </div>
        <div className="dash-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Notas de Crédito</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{creditCount}</div>
        </div>
        <div className="dash-card" style={{ padding: 20, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, color: '#3B82F6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>IGV para PDT 621</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>S/ {igvTotal.toFixed(2)}</div>
        </div>
        <div className="dash-card" style={{ padding: 20, background: '#1A1A2E', color: 'white' }}>
          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Total Facturado</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#22C55E', lineHeight: 1 }}>S/ {totalAmount.toFixed(2)}</div>
        </div>
      </div>

      <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="filter-bar">
          <select value={filter.type} onChange={e => setFilter(p => ({ ...p, type: e.target.value }))}>
            <option value="">Todos los tipos</option>
            <option value="receipt">Boleta</option>
            <option value="invoice">Factura</option>
            <option value="credit_note">Nota de Crédito</option>
          </select>
          <select value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
            <option value="">Todos los estados</option>
            <option value="accepted">Aceptado</option>
            <option value="rejected">Rechazado</option>
            <option value="cancelled">Anulado</option>
          </select>
          <input type="date" value={filter.from} onChange={e => setFilter(p => ({ ...p, from: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13 }} />
          <input type="date" value={filter.to} onChange={e => setFilter(p => ({ ...p, to: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13 }} />
          <button className="btn btn-reload" onClick={loadData}><RefreshCw size={16} /></button>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 24px', fontSize: 15 }} onClick={() => {
          setEmitForm({ type: 'receipt', contract_id: '', service_description: '', total: '', client_ruc: '', client_business_name: '', client_fiscal_address: '' });
          setShowEmitModal(true);
        }}>
          <Plus size={18} /> Emitir Comprobante
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Serie-Número</th>
              <th>Tipo</th>
              <th>Fecha y Cliente</th>
              <th>Descripción</th>
              <th>Montos</th>
              <th>Estado SUNAT</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>Cargando...</td></tr>
            ) : vouchers.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>No hay comprobantes en este período.</td></tr>
            ) : (
              vouchers.map(v => {
                const typeColor = v.type === 'receipt' ? '#22C55E' : v.type === 'invoice' ? '#3B82F6' : '#F59E0B';
                const typeBg = v.type === 'receipt' ? '#DCFCE7' : v.type === 'invoice' ? '#DBEAFE' : '#FEF3C7';
                return (
                <tr key={v.id}>
                  <td>
                    <strong style={{ fontSize: 15, color: '#0F172A', fontFamily: 'monospace' }}>{v.series}-{String(v.number).padStart(6, '0')}</strong>
                  </td>
                  <td>
                    <span style={{ background: typeBg, color: typeColor, padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                      {TYPE_LABELS[v.type] || v.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 600 }}>{new Date(v.issue_date).toLocaleDateString()}</div>
                    <div style={{ fontSize: 12, color: '#64748B', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.clients?.full_name || v.client_business_name}>{v.clients?.full_name || v.client_business_name || 'Cliente Genérico'}</div>
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: '#334155' }} title={v.service_description}>
                    {v.service_description}
                  </td>
                  <td>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Sub: S/ {parseFloat(v.subtotal).toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>IGV: S/ {parseFloat(v.igv_amount).toFixed(2)}</div>
                    <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 800 }}>S/ {parseFloat(v.total).toFixed(2)}</div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_MAP[v.status]?.class || 'badge-gray'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {v.status === 'accepted' && <CheckCircle size={12}/>}
                      {STATUS_MAP[v.status]?.label || v.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {v.pdf_url && (
                        <a href={v.pdf_url} target="_blank" rel="noopener" className="btn-icon btn-dark" title="PDF" style={{ padding: 6, borderRadius: 6 }}>
                          <FileText size={14} color="white" />
                        </a>
                      )}
                      {v.xml_url && (
                        <a href={v.xml_url} target="_blank" rel="noopener" className="btn-icon btn-dark" title="XML" style={{ padding: 6, borderRadius: 6 }}>
                          <Code size={14} color="white" />
                        </a>
                      )}
                      <button className="btn-icon btn-outline" style={{ padding: 6, borderRadius: 6 }} onClick={() => handleResend(v.id)} title="Reenviar a Cliente">
                        <Mail size={14} color="#64748B" />
                      </button>
                      {v.status === 'accepted' && v.type !== 'credit_note' && (
                        <button className="btn-icon" style={{ padding: 6, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6 }} onClick={() => handleCreditNote(v.id)} title="Emitir Nota de Crédito">
                          <FileX size={14} color="#EF4444" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL EMITIR COMPROBANTE */}
      {showEmitModal && (
        <div className="modal-overlay" onClick={()=>setShowEmitModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{maxWidth:600, padding: 32}}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: 20, fontWeight: 800 }}>Emitir Comprobante</h2>
              <button className="modal-close" onClick={()=>setShowEmitModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleEmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Tipo de Comprobante *</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ flex: 1, border: `2px solid ${emitForm.type === 'receipt' ? '#22C55E' : '#E2E8F0'}`, background: emitForm.type === 'receipt' ? '#DCFCE7' : 'white', padding: 16, borderRadius: 8, cursor: 'pointer', textAlign: 'center', fontWeight: 700 }}>
                    <input type="radio" name="vtype" value="receipt" checked={emitForm.type === 'receipt'} onChange={()=>setEmitForm(p=>({...p, type: 'receipt'}))} style={{display:'none'}}/>
                    Boleta Electrónica
                  </label>
                  <label style={{ flex: 1, border: `2px solid ${emitForm.type === 'invoice' ? '#3B82F6' : '#E2E8F0'}`, background: emitForm.type === 'invoice' ? '#DBEAFE' : 'white', padding: 16, borderRadius: 8, cursor: 'pointer', textAlign: 'center', fontWeight: 700 }}>
                    <input type="radio" name="vtype" value="invoice" checked={emitForm.type === 'invoice'} onChange={()=>setEmitForm(p=>({...p, type: 'invoice'}))} style={{display:'none'}}/>
                    Factura Electrónica
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Asociar a Contrato Cerrado (Opcional)</label>
                <select className="form-select" value={emitForm.contract_id} onChange={e=>onContractSelect(e.target.value)}>
                  <option value="">Emitir comprobante libre...</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.clients?.full_name} - S/ {c.total_amount}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Descripción del Servicio *</label>
                <input className="form-input" required placeholder="Ej. Servicio de Alquiler de Vehículo (Placa: ABC-123)" value={emitForm.service_description} onChange={e=>setEmitForm(p=>({...p,service_description:e.target.value}))}/>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Monto Total a Facturar (Inc. IGV) (S/) *</label>
                <input className="form-input" style={{ fontSize: 20, fontWeight: 800, padding: 12, height: 'auto' }} type="number" step="0.01" min="0.1" required value={emitForm.total} onChange={e=>setEmitForm(p=>({...p,total:e.target.value}))}/>
                {emitForm.total > 0 && (
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#64748B' }}>
                    <span>Subtotal: S/ {(emitForm.total / (1 + (taxConfig?.igv_rate || 0.18))).toFixed(2)}</span>
                    <span>IGV ({(taxConfig?.igv_rate || 0.18)*100}%): S/ {(emitForm.total - (emitForm.total / (1 + (taxConfig?.igv_rate || 0.18)))).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {emitForm.type === 'invoice' && (
                <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Datos de Facturación</h4>
                  <div className="form-row-3">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">RUC *</label>
                      <input className="form-input" required={emitForm.type === 'invoice'} value={emitForm.client_ruc} onChange={e=>setEmitForm(p=>({...p,client_ruc:e.target.value}))}/>
                    </div>
                    <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                      <label className="form-label">Razón Social *</label>
                      <input className="form-input" required={emitForm.type === 'invoice'} value={emitForm.client_business_name} onChange={e=>setEmitForm(p=>({...p,client_business_name:e.target.value}))}/>
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Dirección Fiscal *</label>
                    <input className="form-input" required={emitForm.type === 'invoice'} value={emitForm.client_fiscal_address} onChange={e=>setEmitForm(p=>({...p,client_fiscal_address:e.target.value}))}/>
                  </div>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" className="btn btn-outline" onClick={()=>setShowEmitModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0F172A', padding: '12px 24px', fontSize: 15 }} disabled={saving}>
                  {saving ? 'Procesando...' : 'Emitir y Enviar a SUNAT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

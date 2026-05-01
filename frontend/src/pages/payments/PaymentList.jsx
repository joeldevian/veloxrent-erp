import TopBar from '../../components/TopBar';
import { useState, useEffect } from 'react';
import { paymentService, contractService } from '../../services/api';
import { DollarSign, CreditCard, Landmark, ArrowRightLeft, Smartphone, Plus, FileText, CheckCircle } from 'lucide-react';
import { Toast, showAlert, showConfirm } from '../../utils/alert';

const METHOD_LABELS = { cash: 'Efectivo', yape: 'Yape', plin: 'Plin', card_debit: 'T. Débito', card_credit: 'T. Crédito', bank_transfer: 'Transferencia' };

export default function PaymentList() {
  const [cashClose, setCashClose] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  
  const [form, setForm] = useState({
    contract_id: '',
    type: 'charge', // charge, guarantee, adjustment
    amount: '',
    payment_method: 'cash',
    operation_code: '',
    card_last_four: '',
    notes: ''
  });

  useEffect(() => { 
    loadData(); 
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cashRes, contractRes] = await Promise.all([
        paymentService.cashClose(today),
        contractService.getAll({ status: 'active' }) // Cargar contratos activos para el selector
      ]);
      setCashClose(cashRes.data.data);
      setContracts(contractRes.data.data || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if(!form.contract_id) return showAlert('Debe seleccionar un contrato asociado', 'warning');
    if(!form.amount || form.amount <= 0) return showAlert('El monto debe ser mayor a 0', 'warning');

    setSaving(true);
    try {
      await paymentService.create(form);
      Toast.fire({ icon: 'success', title: 'Pago registrado con éxito' });
      setForm({
        contract_id: '', type: 'charge', amount: '', payment_method: 'cash', operation_code: '', card_last_four: '', notes: ''
      });
      loadData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al registrar pago', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseCash = async () => {
    if(!await showConfirm('¿Estás seguro de cerrar la caja de hoy? Esto es un proceso administrativo.')) return;
    Toast.fire({ icon: 'success', title: 'Caja cerrada y reporte generado' });
  };

  const methods = [
    { id: 'cash', label: 'Efectivo', color: '#22C55E', icon: DollarSign, bg: '#DCFCE7' },
    { id: 'yape', label: 'Yape', color: '#7E22CE', icon: Smartphone, bg: '#F3E8FF' },
    { id: 'plin', label: 'Plin', color: '#0EA5E9', icon: Smartphone, bg: '#E0F2FE' },
    { id: 'card_debit', label: 'Débito', color: '#F59E0B', icon: CreditCard, bg: '#FEF3C7' },
    { id: 'card_credit', label: 'Crédito', color: '#EF4444', icon: CreditCard, bg: '#FEE2E2' },
    { id: 'bank_transfer', label: 'Transf.', color: '#3B82F6', icon: Landmark, bg: '#DBEAFE' }
  ];

  const getMethodAmount = (id) => {
    if(!cashClose || !cashClose.summary) return 0;
    return parseFloat(cashClose.summary[id] || 0);
  };

  return (
    <div className="main-content">
      <TopBar title="Caja y Pagos" />
      
      {/* SECCIÓN SUPERIOR: RESUMEN DEL DÍA */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        
        {/* Total General */}
        <div style={{ flex: '1 1 300px', background: '#0F172A', borderRadius: 12, padding: 32, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 14, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>Total del Día (Caja)</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#22C55E', lineHeight: 1, marginBottom: 24 }}>
            S/ {parseFloat(cashClose?.summary?.total || 0).toFixed(2)}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', fontSize: 16, fontWeight: 700, padding: 16, background: '#22C55E', color: 'white', border: 'none' }} onClick={handleCloseCash}>
            Cerrar Caja del Día
          </button>
        </div>

        {/* Desglose por Método */}
        <div style={{ flex: 2, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {methods.map(m => (
            <div key={m.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#64748B' }}>{m.label}</span>
                <div style={{ background: m.bg, color: m.color, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <m.icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 16 }}>
                S/ {getMethodAmount(m.id).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN MEDIA: REGISTRAR PAGO INLINE */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 32, marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={20} color="#22C55E"/> Registrar Nuevo Ingreso / Cobro
        </h3>
        
        <form onSubmit={handleCreatePayment} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ display: 'flex', gap: 24 }}>
            <div className="form-group" style={{ flex: 2, margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Contrato Asociado *</label>
              <select className="form-select" style={{ fontSize: 15, padding: 12, height: 'auto' }} required value={form.contract_id} onChange={e=>setForm(p=>({...p,contract_id:e.target.value}))}>
                <option value="">Seleccione un contrato activo...</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>{c.clients?.full_name} — Vehículo: {c.vehicles?.plate}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Concepto *</label>
              <select className="form-select" style={{ fontSize: 15, padding: 12, height: 'auto' }} required value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                <option value="charge">Cobro de Alquiler</option>
                <option value="guarantee">Cobro de Garantía</option>
                <option value="adjustment">Ajuste / Extra</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Monto (S/) *</label>
              <input className="form-input" style={{ fontSize: 18, fontWeight: 800, padding: 12, height: 'auto' }} type="number" step="0.01" min="0.1" required value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, marginBottom: 12 }}>Método de Pago *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
              {methods.map(m => (
                <div key={m.id} 
                     onClick={() => setForm(p=>({...p, payment_method: m.id}))}
                     style={{ 
                       border: `2px solid ${form.payment_method === m.id ? m.color : '#E2E8F0'}`, 
                       background: form.payment_method === m.id ? m.bg : 'white',
                       padding: '16px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                       display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
                     }}>
                  <m.icon size={24} color={form.payment_method === m.id ? m.color : '#94A3B8'}/>
                  <span style={{ fontWeight: form.payment_method === m.id ? 800 : 600, color: form.payment_method === m.id ? '#0F172A' : '#64748B', fontSize: 13 }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {['yape', 'plin', 'bank_transfer'].includes(form.payment_method) && (
            <div className="form-group" style={{ margin: 0, width: '30%' }}>
              <label className="form-label">Nro. de Operación *</label>
              <input className="form-input" required value={form.operation_code} onChange={e=>setForm(p=>({...p,operation_code:e.target.value}))}/>
            </div>
          )}

          {['card_debit', 'card_credit'].includes(form.payment_method) && (
            <div className="form-group" style={{ margin: 0, width: '30%' }}>
              <label className="form-label">Últimos 4 dígitos *</label>
              <input className="form-input" required maxLength={4} placeholder="Ej. 4242" value={form.card_last_four} onChange={e=>setForm(p=>({...p,card_last_four:e.target.value}))}/>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: 16, background: '#0F172A' }} disabled={saving}>
              {saving ? 'Registrando...' : 'Procesar Ingreso a Caja'}
            </button>
          </div>
        </form>
      </div>

      {/* SECCIÓN INFERIOR: HISTORIAL DEL DÍA */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color="#64748B"/> Movimientos Registrados Hoy
        </h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Concepto</th>
                <th>Método</th>
                <th>Operación/Tarjeta</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign:'center',padding:40}}>Cargando movimientos...</td></tr>
              ) : (!cashClose?.payments || cashClose.payments.length === 0) ? (
                <tr><td colSpan="5" style={{textAlign:'center',padding:40,color:'#94A3B8'}}>No hay movimientos registrados hoy en caja.</td></tr>
              ) : (
                cashClose.payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: '#64748B' }}>{new Date(p.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{textTransform:'capitalize', fontWeight: 600, color: '#334155'}}>{p.type === 'charge' ? 'Alquiler/Reserva' : p.type === 'guarantee' ? 'Garantía' : p.type}</td>
                    <td>
                      <span className="badge badge-gray" style={{ background: '#F1F5F9', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {METHOD_LABELS[p.payment_method] || p.payment_method}
                      </span>
                    </td>
                    <td style={{ color: '#64748B', fontFamily: 'monospace' }}>{p.operation_code || p.card_last_four || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#22C55E' }}>S/ {parseFloat(p.amount).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

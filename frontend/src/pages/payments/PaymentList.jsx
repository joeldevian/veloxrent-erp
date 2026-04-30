import TopBar from '../../components/TopBar';
import { useState, useEffect } from 'react';
import { paymentService } from '../../services/api';
import { DollarSign, RefreshCw } from 'lucide-react';

const METHOD_LABELS = { cash: 'Efectivo', yape: 'Yape', plin: 'Plin', card_debit: 'T. Débito', card_credit: 'T. Crédito', bank_transfer: 'Transferencia' };

export default function PaymentList() {
  const [cashClose, setCashClose] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { loadCashClose(); }, []);

  const loadCashClose = async () => {
    try {
      const res = await paymentService.cashClose(today);
      setCashClose(res.data.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="main-content">
      <TopBar title="Caja y Pagos" />
      <div className="dashboard-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:24}}>
        {cashClose && Object.entries(cashClose.summary || {}).filter(([k]) => k !== 'total').map(([method, amount]) => (
          <div className="dash-card" key={method}>
            <div className="dash-card-header"><DollarSign size={18}/> {METHOD_LABELS[method] || method}</div>
            <div className="dash-card-value">S/ {parseFloat(amount).toFixed(2)}</div>
          </div>
        ))}
      </div>
      {cashClose && (
        <div style={{background:'var(--bg-card)',borderRadius:12,padding:24,color:'white',textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:14,color:'#b0bec5',marginBottom:8}}>TOTAL DEL DÍA</div>
          <div style={{fontSize:48,fontWeight:800,color:'var(--accent-green)'}}>S/ {parseFloat(cashClose.summary?.total || 0).toFixed(2)}</div>
        </div>
      )}
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Tipo</th><th>Monto</th><th>Método</th><th>Operación</th><th>Hora</th></tr></thead>
          <tbody>
            {(cashClose?.payments || []).map(p => (
              <tr key={p.id}>
                <td style={{textTransform:'capitalize'}}>{p.type}</td>
                <td><strong>S/ {parseFloat(p.amount).toFixed(2)}</strong></td>
                <td>{METHOD_LABELS[p.payment_method] || p.payment_method}</td>
                <td>{p.operation_code || p.card_last_four || '—'}</td>
                <td>{new Date(p.created_at).toLocaleTimeString('es-PE')}</td>
              </tr>
            ))}
            {(!cashClose?.payments || cashClose.payments.length === 0) && (
              <tr><td colSpan="5" style={{textAlign:'center',padding:40,color:'#757575'}}>Sin movimientos hoy</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

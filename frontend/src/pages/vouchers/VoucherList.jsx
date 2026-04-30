import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import { voucherService } from '../../services/api';
import { RefreshCw, Download, Mail, FileX, Search, Receipt } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '', from: '', to: '' });
  const [igvTotal, setIgvTotal] = useState(0);

  useEffect(() => { loadVouchers(); }, [filter]);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.type) params.type = filter.type;
      if (filter.status) params.status = filter.status;
      if (filter.from) params.from = filter.from;
      if (filter.to) params.to = filter.to;
      const res = await voucherService.getAll(params);
      const data = res.data.data || [];
      setVouchers(data);
      const igv = data
        .filter(v => v.status === 'accepted' && v.type !== 'credit_note')
        .reduce((sum, v) => sum + (parseFloat(v.igv_amount) || 0), 0);
      setIgvTotal(igv);
    } catch (e) { console.error(e); } finally { setLoading(false); }
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
      loadVouchers();
      Toast.fire({ icon: 'success', title: 'Nota de crédito emitida' });
    } catch (e) { showAlert(e.response?.data?.message || 'Error', 'error'); }
  };

  const receiptCount = vouchers.filter(v => v.type === 'receipt' && v.status === 'accepted').length;
  const invoiceCount = vouchers.filter(v => v.type === 'invoice' && v.status === 'accepted').length;
  const totalAmount = vouchers
    .filter(v => v.status === 'accepted' && v.type !== 'credit_note')
    .reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);

  return (
    <div className="main-content">
      <TopBar title="Comprobantes Electrónicos" />

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="dash-card">
          <div className="dash-card-header"><Receipt size={18} /> Boletas</div>
          <div className="dash-card-value">{receiptCount}</div>
          <div className="dash-card-label">aceptadas por SUNAT</div>
        </div>
        <div className="dash-card">
          <div className="dash-card-header"><Receipt size={18} /> Facturas</div>
          <div className="dash-card-value">{invoiceCount}</div>
          <div className="dash-card-label">aceptadas por SUNAT</div>
        </div>
        <div className="dash-card">
          <div className="dash-card-header"><Receipt size={18} /> IGV Acumulado</div>
          <div className="dash-card-value">S/ {igvTotal.toFixed(2)}</div>
          <div className="dash-card-label">para PDT 621</div>
        </div>
        <div className="dash-card">
          <div className="dash-card-header"><Receipt size={18} /> Total Facturado</div>
          <div className="dash-card-value">S/ {totalAmount.toFixed(2)}</div>
          <div className="dash-card-label">en el período</div>
        </div>
      </div>

      <div className="filter-bar">
        <select value={filter.type} onChange={e => setFilter(p => ({ ...p, type: e.target.value }))}>
          <option value="">Todos los tipos</option>
          <option value="receipt">Boleta</option>
          <option value="invoice">Factura</option>
          <option value="credit_note">Nota de crédito</option>
        </select>
        <select value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
          <option value="">Todos los estados</option>
          <option value="accepted">Aceptado</option>
          <option value="rejected">Rechazado</option>
          <option value="cancelled">Anulado</option>
          <option value="draft">Borrador</option>
        </select>
        <input type="date" value={filter.from} onChange={e => setFilter(p => ({ ...p, from: e.target.value }))} placeholder="Desde" />
        <input type="date" value={filter.to} onChange={e => setFilter(p => ({ ...p, to: e.target.value }))} placeholder="Hasta" />
        <button className="btn btn-reload" onClick={loadVouchers}><RefreshCw size={16} /></button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Serie-Número</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Subtotal</th>
              <th>IGV</th>
              <th>Total</th>
              <th>Estado SUNAT</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40 }}>Cargando...</td></tr>
            ) : vouchers.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40, color: '#757575' }}>No hay comprobantes</td></tr>
            ) : (
              vouchers.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.series}-{String(v.number).padStart(6, '0')}</strong></td>
                  <td>{TYPE_LABELS[v.type] || v.type}</td>
                  <td>{v.issue_date}</td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.service_description}
                  </td>
                  <td>S/ {parseFloat(v.subtotal).toFixed(2)}</td>
                  <td>S/ {parseFloat(v.igv_amount).toFixed(2)}</td>
                  <td><strong>S/ {parseFloat(v.total).toFixed(2)}</strong></td>
                  <td>
                    <span className={`badge ${STATUS_MAP[v.status]?.class || 'badge-gray'}`}>
                      {STATUS_MAP[v.status]?.label || v.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {v.pdf_url && (
                        <a href={v.pdf_url} target="_blank" rel="noopener" className="btn-icon btn-dark" title="Descargar PDF" style={{ padding: 6, borderRadius: 4, display: 'inline-flex' }}>
                          <Download size={14} color="white" />
                        </a>
                      )}
                      <button className="btn-icon btn-dark" style={{ padding: 6 }} onClick={() => handleResend(v.id)} title="Reenviar por correo">
                        <Mail size={14} color="white" />
                      </button>
                      {v.status === 'accepted' && v.type !== 'credit_note' && (
                        <button className="btn-icon" style={{ padding: 6, background: '#e53935', borderRadius: 4, border: 'none' }} onClick={() => handleCreditNote(v.id)} title="Nota de crédito">
                          <FileX size={14} color="white" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import { reportService } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, Car, Users, Receipt, RefreshCw } from 'lucide-react';

const PIE_COLORS = ['#00c853', '#4CAF50', '#FFA500', '#2196F3', '#9C27B0', '#FF5722'];
const METHOD_LABELS = { cash: 'Efectivo', yape: 'Yape', plin: 'Plin', card_debit: 'T. Débito', card_credit: 'T. Crédito', bank_transfer: 'Transferencia' };

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('income');
  const [dateRange, setDateRange] = useState({ from: getMonthStart(), to: getToday() });
  const [incomeData, setIncomeData] = useState(null);
  const [fleetData, setFleetData] = useState([]);
  const [paymentData, setPaymentData] = useState({});
  const [voucherData, setVoucherData] = useState(null);
  const [crmData, setCrmData] = useState(null);
  const [loading, setLoading] = useState(false);

  function getToday() { return new Date().toISOString().split('T')[0]; }
  function getMonthStart() {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  }

  useEffect(() => { loadReport(); }, [activeTab, dateRange]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = { from: dateRange.from, to: dateRange.to };
      switch (activeTab) {
        case 'income': {
          const res = await reportService.income(params);
          setIncomeData(res.data.data);
          break;
        }
        case 'fleet': {
          const res = await reportService.fleet(params);
          setFleetData(res.data.data || []);
          break;
        }
        case 'payments': {
          const res = await reportService.paymentMethods(params);
          setPaymentData(res.data.data || {});
          break;
        }
        case 'vouchers': {
          const res = await reportService.vouchers(params);
          setVoucherData(res.data.data);
          break;
        }
        case 'crm': {
          const res = await reportService.crm();
          setCrmData(res.data.data);
          break;
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const tabs = [
    { key: 'income', label: 'Ingresos', icon: TrendingUp },
    { key: 'fleet', label: 'Ocupación Flota', icon: Car },
    { key: 'payments', label: 'Métodos Pago', icon: Receipt },
    { key: 'vouchers', label: 'Tributario', icon: Receipt },
    { key: 'crm', label: 'CRM', icon: Users },
  ];

  const paymentPieData = Object.entries(paymentData).map(([key, value]) => ({
    name: METHOD_LABELS[key] || key, value: parseFloat(value) || 0
  })).filter(d => d.value > 0);

  const fleetBarData = fleetData.map(v => ({
    name: `${v.brand} ${v.model}`, dias: v.days_rented, contratos: v.total_contracts
  }));

  return (
    <div className="main-content">
      <TopBar title="Reportes" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key}
            className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-dark'}`}
            onClick={() => setActiveTab(tab.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="filter-bar" style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Desde:</label>
        <input type="date" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))} />
        <label style={{ fontSize: 13, fontWeight: 600 }}>Hasta:</label>
        <input type="date" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))} />
        <button className="btn btn-reload" onClick={loadReport}><RefreshCw size={16} /></button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#757575' }}>Cargando reporte...</div>
      ) : (
        <>
          {/* INGRESOS */}
          {activeTab === 'income' && incomeData && (
            <div>
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}>
                <div className="dash-card">
                  <div className="dash-card-header"><TrendingUp size={18} /> Ingresos Totales</div>
                  <div className="dash-card-value">S/ {parseFloat(incomeData.total || 0).toFixed(2)}</div>
                  <div className="dash-card-label">en el período seleccionado</div>
                </div>
                <div className="dash-card">
                  <div className="dash-card-header"><Receipt size={18} /> Contratos Cerrados</div>
                  <div className="dash-card-value">{incomeData.contracts?.length || 0}</div>
                  <div className="dash-card-label">contratos completados</div>
                </div>
              </div>
              {incomeData.contracts?.length > 0 && (
                <div className="data-table-container" style={{ padding: 24 }}>
                  <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Ingresos por Contrato</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={incomeData.contracts.map((c, i) => ({ name: `#${i + 1}`, total: parseFloat(c.total_amount) || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(v) => [`S/ ${v.toFixed(2)}`, 'Total']} />
                      <Bar dataKey="total" fill="#00c853" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* FLOTA */}
          {activeTab === 'fleet' && (
            <div>
              {fleetBarData.length > 0 ? (
                <div className="data-table-container" style={{ padding: 24 }}>
                  <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Días Alquilados por Vehículo</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={fleetBarData} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                      <Tooltip />
                      <Bar dataKey="dias" fill="#4CAF50" name="Días" radius={[0, 6, 6, 0]} />
                      <Bar dataKey="contratos" fill="#2196F3" name="Contratos" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="data-table-container" style={{ padding: 40, textAlign: 'center', color: '#757575' }}>Sin datos de flota</div>
              )}
            </div>
          )}

          {/* MÉTODOS DE PAGO */}
          {activeTab === 'payments' && (
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="data-table-container" style={{ padding: 24 }}>
                <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Distribución por Método</h3>
                {paymentPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={paymentPieData} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={12}>
                        {paymentPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `S/ ${v.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#757575' }}>Sin datos</div>
                )}
              </div>
              <div className="data-table-container" style={{ padding: 24 }}>
                <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Desglose</h3>
                <table className="data-table">
                  <thead><tr><th>Método</th><th>Monto</th></tr></thead>
                  <tbody>
                    {Object.entries(paymentData).map(([method, amount]) => (
                      <tr key={method}>
                        <td>{METHOD_LABELS[method] || method}</td>
                        <td><strong>S/ {parseFloat(amount).toFixed(2)}</strong></td>
                      </tr>
                    ))}
                    {Object.keys(paymentData).length === 0 && (
                      <tr><td colSpan="2" style={{ textAlign: 'center', padding: 20, color: '#757575' }}>Sin movimientos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TRIBUTARIO */}
          {activeTab === 'vouchers' && voucherData && (
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
              <div className="dash-card">
                <div className="dash-card-header"><Receipt size={18} /> Boletas</div>
                <div className="dash-card-value">{voucherData.receipts_count}</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-header"><Receipt size={18} /> Facturas</div>
                <div className="dash-card-value">{voucherData.invoices_count}</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-header"><Receipt size={18} /> IGV Total</div>
                <div className="dash-card-value">S/ {parseFloat(voucherData.total_igv || 0).toFixed(2)}</div>
                <div className="dash-card-label">Para declaración PDT 621</div>
              </div>
            </div>
          )}

          {/* CRM */}
          {activeTab === 'crm' && crmData && (
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="dash-card">
                <div className="dash-card-header"><Users size={18} /> Reservas</div>
                <div className="dash-card-value">{crmData.total_reservas}</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-header"><Users size={18} /> Cerrados</div>
                <div className="dash-card-value">{crmData.contratos_cerrados}</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-header"><TrendingUp size={18} /> Conversión</div>
                <div className="dash-card-value">{crmData.conversion_rate}%</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-header"><Users size={18} /> Clientes</div>
                <div className="dash-card-value">{crmData.total_clientes}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

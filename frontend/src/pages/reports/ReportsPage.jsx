import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import { reportService } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Car, Users, Receipt, RefreshCw, Download, DollarSign, BarChart2 } from 'lucide-react';

const PIE_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const METHOD_LABELS = { cash: 'Efectivo', yape: 'Yape', plin: 'Plin', card_debit: 'T. Débito', card_credit: 'T. Crédito', bank_transfer: 'Transferencia' };

function getToday() { return new Date().toISOString().split('T')[0]; }
function getMonthStart() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().split('T')[0];
}

const TABS = [
  { key: 'income', label: 'Ingresos', icon: TrendingUp, color: '#22C55E' },
  { key: 'fleet', label: 'Ocupación', icon: Car, color: '#3B82F6' },
  { key: 'payments', label: 'Pagos', icon: DollarSign, color: '#F59E0B' },
  { key: 'vouchers', label: 'Tributario', icon: Receipt, color: '#8B5CF6' },
  { key: 'crm', label: 'CRM', icon: Users, color: '#EC4899' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0F172A', padding: '10px 16px', borderRadius: 8, border: 'none', color: 'white', fontSize: 13 }}>
        <div style={{ color: '#94A3B8', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: 700 }}>
            {p.name}: {p.name === 'Ingresos' || p.name === 'Total' ? `S/ ${Number(p.value).toFixed(2)}` : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('income');
  const [dateRange, setDateRange] = useState({ from: getMonthStart(), to: getToday() });
  const [incomeData, setIncomeData] = useState(null);
  const [fleetData, setFleetData] = useState([]);
  const [paymentData, setPaymentData] = useState({});
  const [voucherData, setVoucherData] = useState(null);
  const [crmData, setCrmData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadReport(); }, [activeTab, dateRange]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = { from: dateRange.from, to: dateRange.to };
      switch (activeTab) {
        case 'income': { const r = await reportService.income(params); setIncomeData(r.data.data); break; }
        case 'fleet': { const r = await reportService.fleet(params); setFleetData(r.data.data || []); break; }
        case 'payments': { const r = await reportService.paymentMethods(params); setPaymentData(r.data.data || {}); break; }
        case 'vouchers': { const r = await reportService.vouchers(params); setVoucherData(r.data.data); break; }
        case 'crm': { const r = await reportService.crm(); setCrmData(r.data.data); break; }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const paymentPieData = Object.entries(paymentData)
    .filter(([k]) => k !== 'total')
    .map(([key, value]) => ({ name: METHOD_LABELS[key] || key, value: parseFloat(value) || 0 }))
    .filter(d => d.value > 0);

  const fleetBarData = fleetData.map(v => ({
    name: `${v.brand} ${v.model}`.substring(0, 18),
    Días: v.days_rented,
    Contratos: v.total_contracts
  }));

  const incomeBarData = (incomeData?.contracts || []).map((c, i) => ({
    name: `#${i + 1}`,
    Ingresos: parseFloat(c.total_amount) || 0
  }));

  const activeTabData = TABS.find(t => t.key === activeTab);

  return (
    <div className="main-content">
      <TopBar title="Reportes y Análisis" />

      <div style={{ display: 'flex', gap: 24 }}>

        {/* SIDEBAR DE TABS */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    background: isActive ? '#0F172A' : 'white',
                    border: `1px solid ${isActive ? '#0F172A' : '#E2E8F0'}`,
                    borderRadius: 10, cursor: 'pointer', width: '100%', textAlign: 'left',
                    color: isActive ? 'white' : '#64748B', fontWeight: 600, fontSize: 14,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <tab.icon size={18} color={isActive ? tab.color : '#94A3B8'} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Date Range */}
          <div style={{ marginTop: 24, background: 'white', borderRadius: 10, border: '1px solid #E2E8F0', padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 12 }}>Período</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Desde</div>
                <input type="date" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Hasta</div>
                <input type="date" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13 }} />
              </div>
              <button className="btn btn-reload" style={{ width: '100%', justifyContent: 'center', gap: 6, display: 'flex', alignItems: 'center' }} onClick={loadReport}>
                <RefreshCw size={14} /> Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header del Reporte Activo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: '#F1F5F9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeTabData && <activeTabData.icon size={22} color={activeTabData.color} />}
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Reporte de {activeTabData?.label}</h2>
                <div style={{ fontSize: 13, color: '#64748B' }}>
                  {dateRange.from} → {dateRange.to}
                </div>
              </div>
            </div>
            <button className="btn btn-outline" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <Download size={15} /> Exportar
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#94A3B8' }}>
              <BarChart2 size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }}/>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Generando reporte...</div>
            </div>
          ) : (
            <>
              {/* === INGRESOS === */}
              {activeTab === 'income' && incomeData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div style={{ background: '#0F172A', borderRadius: 12, padding: 24, color: 'white' }}>
                      <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Ingresos Totales</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: '#22C55E' }}>S/ {parseFloat(incomeData.total || 0).toFixed(2)}</div>
                    </div>
                    <div className="dash-card" style={{ padding: 24 }}>
                      <div style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Contratos Cerrados</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A' }}>{incomeData.contracts?.length || 0}</div>
                    </div>
                    <div className="dash-card" style={{ padding: 24 }}>
                      <div style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Ticket Promedio</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A' }}>
                        S/ {incomeData.contracts?.length ? (incomeData.total / incomeData.contracts.length).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>

                  {incomeBarData.length > 0 && (
                    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 24 }}>Ingresos por Contrato</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={incomeBarData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `S/${v}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="Ingresos" fill="#22C55E" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* === FLOTA === */}
              {activeTab === 'fleet' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {fleetBarData.length > 0 ? (
                    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 24 }}>Días Alquilados por Vehículo</h3>
                      <ResponsiveContainer width="100%" height={Math.max(300, fleetBarData.length * 55)}>
                        <BarChart data={fleetBarData} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} width={130} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 13 }}/>
                          <Bar dataKey="Días" fill="#22C55E" radius={[0, 6, 6, 0]} barSize={14} />
                          <Bar dataKey="Contratos" fill="#3B82F6" radius={[0, 6, 6, 0]} barSize={14} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 60, textAlign: 'center', color: '#94A3B8' }}>Sin datos de flota para este período.</div>
                  )}
                </div>
              )}

              {/* === MÉTODOS DE PAGO === */}
              {activeTab === 'payments' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 24 }}>Distribución por Método</h3>
                    {paymentPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} dataKey="value" paddingAngle={3}>
                            {paymentPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
                          </Pie>
                          <Tooltip formatter={v => `S/ ${v.toFixed(2)}`} />
                          <Legend wrapperStyle={{ fontSize: 13 }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Sin movimientos en este período.</div>
                    )}
                  </div>

                  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 24 }}>Desglose de Ingresos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {Object.entries(paymentData).filter(([k]) => k !== 'total').map(([method, amount], i) => {
                        const total = parseFloat(paymentData.total || 1);
                        const pct = ((parseFloat(amount) / total) * 100).toFixed(1);
                        return (
                          <div key={method}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                              <span style={{ fontWeight: 600, color: '#334155' }}>{METHOD_LABELS[method] || method}</span>
                              <div style={{ display: 'flex', gap: 12 }}>
                                <span style={{ color: '#64748B' }}>{pct}%</span>
                                <strong style={{ color: '#0F172A' }}>S/ {parseFloat(amount).toFixed(2)}</strong>
                              </div>
                            </div>
                            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 3 }}></div>
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(paymentData).length <= 1 && (
                        <div style={{ textAlign: 'center', padding: 20, color: '#94A3B8' }}>Sin movimientos</div>
                      )}
                    </div>

                    {paymentData.total > 0 && (
                      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#64748B', fontSize: 14 }}>TOTAL DEL PERÍODO</span>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#22C55E' }}>S/ {parseFloat(paymentData.total || 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === TRIBUTARIO === */}
              {activeTab === 'vouchers' && voucherData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {[
                      { label: 'Boletas', value: voucherData.receipts_count, color: '#22C55E', bg: '#DCFCE7' },
                      { label: 'Facturas', value: voucherData.invoices_count, color: '#3B82F6', bg: '#DBEAFE' },
                      { label: 'Notas Crédito', value: voucherData.credit_notes_count || 0, color: '#F59E0B', bg: '#FEF3C7' },
                      { label: 'IGV (PDT 621)', value: `S/ ${parseFloat(voucherData.total_igv || 0).toFixed(2)}`, color: '#8B5CF6', bg: '#F3E8FF' }
                    ].map(item => (
                      <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: 24 }}>
                        <div style={{ fontSize: 12, color: item.color, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{item.label}</div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#0F172A', borderRadius: 12, padding: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Total Facturado (Inc. IGV)</div>
                      <div style={{ fontSize: 40, fontWeight: 800, color: '#22C55E' }}>S/ {parseFloat(voucherData.total_amount || 0).toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 13, color: '#94A3B8' }}>
                      <div>Período: {dateRange.from} → {dateRange.to}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>Datos listos para Declaración PDT</div>
                    </div>
                  </div>
                </div>
              )}

              {/* === CRM === */}
              {activeTab === 'crm' && crmData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    {[
                      { label: 'Reservas Totales', value: crmData.total_reservas, icon: Receipt, color: '#3B82F6' },
                      { label: 'Contratos Cerrados', value: crmData.contratos_cerrados, icon: TrendingUp, color: '#22C55E' },
                      { label: 'Tasa de Conversión', value: `${crmData.conversion_rate}%`, icon: BarChart2, color: '#F59E0B' },
                      { label: 'Total de Clientes', value: crmData.total_clientes, icon: Users, color: '#EC4899' }
                    ].map(item => (
                      <div key={item.label} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 56, height: 56, background: '#F8FAFC', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <item.icon size={26} color={item.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

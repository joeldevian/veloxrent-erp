import TopBar from '../../components/TopBar';
import { useState, useEffect } from 'react';
import { crmService } from '../../services/api';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function CRMPipeline() {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPipeline(); }, []);

  const loadPipeline = async () => {
    try { const res = await crmService.getPipeline(); setPipeline(res.data.data || {}); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const getUrgency = (date) => {
    if (!date) return null;
    const today = new Date();
    const start = new Date(date);
    const diffTime = start - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Iniciado', color: '#64748B', bg: '#F1F5F9' };
    if (diffDays <= 2) return { label: `En ${diffDays} días`, color: '#DC2626', bg: '#FEE2E2' };
    if (diffDays <= 5) return { label: `En ${diffDays} días`, color: '#D97706', bg: '#FEF3C7' };
    return { label: `En ${diffDays} días`, color: '#16A34A', bg: '#DCFCE7' };
  };

  const columns = [
    { key: 'solicitud_recibida', title: 'Solicitud Recibida', color: '#FFA500' },
    { key: 'contactado', title: 'Contactado', color: '#2196F3' },
    { key: 'contrato_abierto', title: 'Contrato Abierto', color: '#4CAF50' },
    { key: 'contrato_cerrado', title: 'Contrato Cerrado', color: '#757575' },
  ];

  return (
    <div className="main-content">
      <TopBar title="Seguimiento de reservas" />
      {loading ? <div style={{textAlign:'center',padding:60}}>Cargando...</div> : (
        <div style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:20}}>
          {columns.map(col => (
            <div key={col.key} style={{minWidth:300, flex: 1}}>
              <div style={{background:col.color,color:'white',padding:'12px 16px',borderRadius:'10px 10px 0 0',fontWeight:700,fontSize:14,display:'flex',justifyContent:'space-between', alignItems: 'center'}}>
                {col.title}
                <span style={{background:'rgba(255,255,255,0.2)',borderRadius:12,padding:'2px 10px',fontSize:12}}>{(pipeline[col.key] || []).length}</span>
              </div>
              <div style={{background:'#F8FAFC', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius:'0 0 10px 10px',padding:10,minHeight:'70vh'}}>
                {(pipeline[col.key] || []).map(c => {
                  const urgency = getUrgency(c.start_datetime);
                  return (
                    <div key={c.id} style={{
                      background:'white',
                      borderRadius:10,
                      padding:16,
                      marginBottom:12,
                      boxShadow:'0 2px 4px rgba(0,0,0,0.04)',
                      border: urgency && col.key !== 'contrato_cerrado' ? `1px solid ${urgency.color}33` : '1px solid #E2E8F0',
                      borderLeft: urgency && col.key !== 'contrato_cerrado' ? `4px solid ${urgency.color}` : '1px solid #E2E8F0'
                    }}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                        <div style={{fontWeight:700,fontSize:14,color:'#0F172A'}}>{c.clients?.full_name}</div>
                        {urgency && col.key !== 'contrato_cerrado' && (
                          <span style={{background:urgency.bg, color:urgency.color, fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:12, textTransform:'uppercase'}}>
                            {urgency.label}
                          </span>
                        )}
                      </div>
                      
                      <div style={{fontSize:12,color:'#475569', fontWeight:600, marginBottom:8}}>
                        {c.vehicles?.brand} {c.vehicles?.model} · <span style={{background:'#F1F5F9', padding:'2px 4px', borderRadius:4}}>{c.vehicles?.plate}</span>
                      </div>

                      <div style={{display:'flex', flexDirection:'column', gap:6, paddingTop:8, borderTop:'1px solid #F1F5F9'}}>
                        <div style={{fontSize:11, color:'#64748B', display:'flex', alignItems:'center', gap:5}}>
                          <Calendar size={12} /> Inicio: <strong>{new Date(c.start_datetime).toLocaleDateString()}</strong>
                        </div>
                        <div style={{fontSize:11, color:'#64748B', display:'flex', alignItems:'center', gap:5}}>
                          <MapPin size={12} /> Destino: <strong>{c.trip_destination || '—'}</strong>
                        </div>
                        <div style={{fontSize:10, color:'#94A3B8', marginTop:4, display:'flex', alignItems:'center', gap:5}}>
                          <Clock size={11} /> Recibida: {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(pipeline[col.key] || []).length === 0 && (
                  <div style={{textAlign:'center',padding:40,color:'#94A3B8',fontSize:13}}>Sin elementos</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

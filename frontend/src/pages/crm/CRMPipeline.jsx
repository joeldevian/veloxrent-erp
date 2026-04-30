import TopBar from '../../components/TopBar';
import { useState, useEffect } from 'react';
import { crmService } from '../../services/api';

export default function CRMPipeline() {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPipeline(); }, []);

  const loadPipeline = async () => {
    try { const res = await crmService.getPipeline(); setPipeline(res.data.data || {}); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const columns = [
    { key: 'solicitud_recibida', title: 'Solicitud Recibida', color: '#FFA500' },
    { key: 'contactado', title: 'Contactado', color: '#2196F3' },
    { key: 'contrato_abierto', title: 'Contrato Abierto', color: '#4CAF50' },
    { key: 'contrato_cerrado', title: 'Contrato Cerrado', color: '#757575' },
  ];

  return (
    <div className="main-content">
      <TopBar title="CRM — Pipeline de Reservas" />
      {loading ? <div style={{textAlign:'center',padding:60}}>Cargando...</div> : (
        <div style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:20}}>
          {columns.map(col => (
            <div key={col.key} style={{minWidth:280,flex:1}}>
              <div style={{background:col.color,color:'white',padding:'12px 16px',borderRadius:'10px 10px 0 0',fontWeight:700,fontSize:14,display:'flex',justifyContent:'space-between'}}>
                {col.title}
                <span style={{background:'rgba(255,255,255,0.2)',borderRadius:12,padding:'2px 10px',fontSize:12}}>{(pipeline[col.key] || []).length}</span>
              </div>
              <div style={{background:'#f5f5f5',borderRadius:'0 0 10px 10px',padding:8,minHeight:300}}>
                {(pipeline[col.key] || []).map(c => (
                  <div key={c.id} style={{background:'white',borderRadius:8,padding:14,marginBottom:8,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
                    <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{c.clients?.full_name}</div>
                    <div style={{fontSize:12,color:'#757575'}}>{c.vehicles?.brand} {c.vehicles?.model} · {c.vehicles?.plate}</div>
                    <div style={{fontSize:12,color:'#757575',marginTop:4}}>Plan: {c.plan} · {c.trip_destination || '—'}</div>
                  </div>
                ))}
                {(pipeline[col.key] || []).length === 0 && (
                  <div style={{textAlign:'center',padding:40,color:'#bdbdbd',fontSize:13}}>Sin elementos</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

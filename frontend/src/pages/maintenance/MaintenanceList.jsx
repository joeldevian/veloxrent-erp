import TopBar from '../../components/TopBar';
import { useState, useEffect } from 'react';
import { maintenanceService, vehicleService } from '../../services/api';
import { Plus, Wrench, X, CheckCircle, Trash2 } from 'lucide-react';
import { Toast, showAlert, showConfirm } from '../../utils/alert';

export default function MaintenanceList() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: '',
    maintenance_type: 'preventivo',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    provider: '',
    notes: ''
  });

  useEffect(() => { loadRecords(); loadVehicles(); }, []);

  const loadRecords = async () => {
    try { const res = await maintenanceService.getAll(); setRecords(res.data.data || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadVehicles = async () => {
    try { const res = await vehicleService.getAll(); setVehicles(res.data.data || []); }
    catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.create(form);
      // Actualizamos estado de vehículo a mantenimiento
      await vehicleService.update(form.vehicle_id, { status: 'mantenimiento' });
      setShowModal(false);
      loadRecords();
      setForm({ vehicle_id: '', maintenance_type: 'preventivo', date: new Date().toISOString().split('T')[0], cost: '', provider: '', notes: '' });
      Toast.fire({ icon: 'success', title: 'Registro guardado' });
    } catch (error) {
      showAlert('Error al guardar mantenimiento', 'error');
    }
  };

  const handleRemove = async (id) => {
    if (await showConfirm('¿Está seguro de eliminar este registro de mantenimiento?')) {
      try {
        await maintenanceService.remove(id);
        loadRecords();
        Toast.fire({ icon: 'success', title: 'Registro eliminado' });
      } catch (error) {
        showAlert('Error al eliminar registro', 'error');
      }
    }
  };

  const handleFinalize = async (vehicle_id) => {
    if (await showConfirm('¿Confirmar que el mantenimiento ha terminado? El vehículo volverá a estar "Disponible".')) {
      try {
        await vehicleService.update(vehicle_id, { status: 'disponible' });
        showAlert('Vehículo liberado y disponible nuevamente.', 'success');
        loadRecords();
        loadVehicles();
      } catch (error) {
        showAlert('Error al liberar vehículo', 'error');
      }
    }
  };

  return (
    <div className="main-content">
      <TopBar title="Mantenimiento de Flota" />
      <div className="toolbar" style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{display:'flex',alignItems:'center',gap:8}}>
          <Plus size={18}/> Nuevo Registro
        </button>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Vehículo</th><th>Tipo</th><th>Fecha</th><th>Costo</th><th>Proveedor</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="6" style={{textAlign:'center',padding:40}}>Cargando...</td></tr> :
            records.filter(r => r.vehicles?.status === 'mantenimiento').length === 0 ? <tr><td colSpan="6" style={{textAlign:'center',padding:40,color:'#757575'}}>Sin mantenimientos activos</td></tr> :
            records.filter(r => r.vehicles?.status === 'mantenimiento').map(r => (
              <tr key={r.id}>
                <td>{r.vehicles?.brand} {r.vehicles?.model} ({r.vehicles?.plate})</td>
                <td style={{textTransform:'capitalize'}}>{r.maintenance_type}</td>
                <td>{r.date}</td>
                <td>S/ {parseFloat(r.cost).toFixed(2)}</td>
                <td>{r.provider || '—'}</td>
                <td>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-primary" style={{padding:'4px 8px',fontSize:12}} onClick={() => handleFinalize(r.vehicle_id)} title="Finalizar Mantenimiento"><CheckCircle size={14}/></button>
                    <button className="btn btn-danger" style={{padding:'4px 8px',fontSize:12}} onClick={() => handleRemove(r.id)} title="Eliminar Registro"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 500}}>
            <div className="modal-header">
              <h2 className="modal-title" style={{display:'flex',alignItems:'center',gap:8}}><Wrench size={20}/> Registrar Mantenimiento</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Vehículo</label>
                <select className="form-control" value={form.vehicle_id} onChange={e=>setForm({...form,vehicle_id:e.target.value})} required>
                  <option value="">Seleccione vehículo...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>)}
                </select>
              </div>
              <div className="form-group" style={{display:'flex',gap:16}}>
                <div style={{flex:1}}>
                  <label>Tipo</label>
                  <select className="form-control" value={form.maintenance_type} onChange={e=>setForm({...form,maintenance_type:e.target.value})} required>
                    <option value="preventivo">Preventivo</option>
                    <option value="correctivo">Correctivo</option>
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label>Fecha</label>
                  <input type="date" className="form-control" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required />
                </div>
              </div>
              <div className="form-group" style={{display:'flex',gap:16}}>
                <div style={{flex:1}}>
                  <label>Costo (S/)</label>
                  <input type="number" step="0.01" className="form-control" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} required />
                </div>
                <div style={{flex:1}}>
                  <label>Taller / Proveedor</label>
                  <input type="text" className="form-control" value={form.provider} onChange={e=>setForm({...form,provider:e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción del Trabajo</label>
                <textarea className="form-control" rows="3" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}></textarea>
              </div>
              <div className="modal-actions" style={{marginTop: 24}}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

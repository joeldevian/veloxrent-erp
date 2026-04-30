import { useState, useEffect } from 'react';
import { Car, CheckCircle2, ChevronRight, X, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { publicService } from '../../services/api';
import { showAlert } from '../../utils/alert';

export default function PublicCatalog() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  const [form, setForm] = useState({
    full_name: '',
    document_number: '',
    phone: '',
    email: '',
    trip_destination: '',
    start_datetime: '',
    end_datetime_planned: '',
    reservation_paid_amount: 0,
    payment_method_reservation: 'yape',
    operation_code: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await publicService.getAvailableVehicles();
      setVehicles(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, operation_code: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await publicService.createReservation({
        vehicle_id: selectedVehicle.id,
        start_datetime: form.start_datetime,
        end_datetime_planned: form.end_datetime_planned,
        trip_destination: form.trip_destination,
        reservation_paid_amount: form.reservation_paid_amount,
        payment_method_reservation: form.payment_method_reservation,
        operation_code: form.operation_code,
        client_data: {
          full_name: form.full_name,
          document_number: form.document_number,
          phone: form.phone,
          email: form.email
        }
      });
      setSuccess(true);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al procesar reserva', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Bar Contacts */}
      <div style={{ backgroundColor: '#1e1b4b', color: 'white', padding: '8px 24px', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <span style={{display: 'flex', alignItems: 'center', gap: 6}}><Mail size={14}/> veloxrent.marketing@gmail.com</span>
          <span style={{display: 'flex', alignItems: 'center', gap: 6}}><Phone size={14}/> 925 285 403</span>
          <span style={{display: 'flex', alignItems: 'center', gap: 6}}><MapPin size={14}/> NAZARENAS, Ayacucho 05001</span>
          <span style={{display: 'flex', alignItems: 'center', gap: 6}}><Clock size={14}/> L a S - 7:00 AM a 6:00 PM</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{cursor:'pointer'}}>FB</span> | <span style={{cursor:'pointer'}}>IG</span> | <span style={{cursor:'pointer'}}>YT</span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav style={{ backgroundColor: 'white', padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Car size={36} color="#2563eb" />
          <span style={{ fontSize: 24, fontWeight: 900, color: '#1e3a8a', fontStyle: 'italic', letterSpacing: '-1px' }}>VELOXRENT</span>
        </div>
        <div style={{ display: 'flex', gap: 32, fontWeight: 600, color: '#1e40af', fontSize: 14 }}>
          <a href="#" style={{textDecoration: 'none', color: 'inherit'}}>INICIO</a>
          <a href="#" style={{textDecoration: 'none', color: 'inherit'}}>VEHÍCULOS</a>
          <a href="#" style={{textDecoration: 'none', color: 'inherit'}}>PLANES Y TURISMO</a>
          <a href="#" style={{textDecoration: 'none', color: 'inherit'}}>EMPRESA</a>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button style={{ padding: '10px 24px', borderRadius: 8, border: '2px solid #2563eb', color: '#2563eb', fontWeight: 600, background: 'transparent', cursor: 'pointer' }}>Más información</button>
          <button style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Comprar vehículos</button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '48px', maxWidth: 1200, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 100, fontSize: 18, color: '#64748b' }}>Cargando vehículos disponibles...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {vehicles.map(v => (
              <div key={v.id} style={{ display: 'flex', background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', gap: 32 }}>
                
                {/* Image Section */}
                <div style={{ flex: '1 1 50%', minHeight: 400, position: 'relative' }}>
                  <img src={v.photo_url || (v.brand.includes('Toyota') ? '/cars/hilux.png' : '/cars/hyundai.png')} alt={`${v.brand} ${v.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Details Section */}
                <div style={{ flex: '1 1 50%', padding: '40px 40px 40px 0', display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>{v.brand} {v.model}</h2>
                  <div style={{ fontSize: 16, color: '#64748b', marginBottom: 24 }}>Año {v.year} • {v.type}</div>

                  <div style={{ background: '#f0fdf4', padding: 24, borderRadius: 12, marginBottom: 24, border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: 14, color: '#166534', fontWeight: 600, marginBottom: 4 }}>S/ {parseFloat(v.extra_km_rate_normal).toFixed(2)} por km extra</div>
                    <div style={{ fontSize: 48, fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>S/ {parseFloat(v.base_price_per_day).toFixed(2)}</div>
                    <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 8 }}>200 km por 24 horas</div>
                  </div>

                  <div style={{ marginBottom: 32, flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Beneficios incluidos</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#475569' }}><CheckCircle2 size={18} color="#22c55e" /> Kit de emergencia</li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#475569' }}><CheckCircle2 size={18} color="#22c55e" /> Vehículo con SOAT y documentación en regla</li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#475569' }}><CheckCircle2 size={18} color="#22c55e" /> Cobertura full Anti riesgo</li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#475569' }}><CheckCircle2 size={18} color="#22c55e" /> 200km por cada 24 horas</li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => { setSelectedVehicle(v); setSuccess(false); setForm({full_name:'',document_number:'',phone:'',email:'',trip_destination:'',start_datetime:'',end_datetime_planned:'',reservation_paid_amount:0,payment_method_reservation:'yape',operation_code:''}); }}
                    style={{ background: '#2563eb', color: 'white', border: 'none', padding: '16px', borderRadius: 12, fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}>
                    <Car size={20}/> Reservar ahora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Reservation Modal */}
      {selectedVehicle && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 24, overflowY: 'auto' }}>
          <div style={{ background: '#1e293b', borderRadius: 16, width: '100%', maxWidth: 1000, color: 'white', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Alquilar {selectedVehicle.brand} {selectedVehicle.model}</h2>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 14 }}>Complete el formulario para proceder con la reserva</p>
              </div>
              <button onClick={() => setSelectedVehicle(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24}/></button>
            </div>

            {success ? (
              <div style={{ padding: 64, textAlign: 'center' }}>
                <CheckCircle2 size={64} color="#22c55e" style={{ margin: '0 auto 24px auto' }}/>
                <h2 style={{ fontSize: 32, marginBottom: 16 }}>¡Reserva Solicitada con Éxito!</h2>
                <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 32 }}>Hemos recibido su solicitud y el comprobante adjunto. Un ejecutivo de ventas revisará la información y le llamará en breve para darle el visto bueno y confirmar la entrega del vehículo.</p>
                <button onClick={() => setSelectedVehicle(null)} style={{ padding: '16px 32px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Entendido, volver al catálogo</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', overflowY: 'auto' }}>
                {/* Left Side (Car Info) */}
                <div style={{ flex: '1 1 300px', padding: 32, borderRight: '1px solid #334155' }}>
                  <img src={selectedVehicle.photo_url || (selectedVehicle.brand.includes('Toyota') ? '/cars/hilux.png' : '/cars/hyundai.png')} alt="Car" style={{ width: '100%', borderRadius: 8, marginBottom: 24 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: 20 }}>{selectedVehicle.brand} {selectedVehicle.model}</h3>
                      <div style={{ color: '#94a3b8', fontSize: 14 }}>Automóvil • {selectedVehicle.year}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>S/ {parseFloat(selectedVehicle.base_price_per_day).toFixed(2)}</div>
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>200km por c/ 24 horas</div>
                    </div>
                  </div>
                  <div style={{ background: '#0f172a', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Garantía Requerida:</span>
                    <strong style={{ color: 'white' }}>S/ {parseFloat(selectedVehicle.guarantee_amount).toFixed(2)}</strong>
                  </div>
                </div>

                {/* Right Side (Form) */}
                <div style={{ flex: '2 1 500px', padding: 32 }}>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: 20 }}>Información para la Reserva</h3>
                  <form onSubmit={handleReserve} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#cbd5e1' }}>Nombre Completo *</label>
                      <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Ingrese su nombre completo" style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: 8, boxSizing: 'border-box' }}/>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#cbd5e1' }}>Destino *</label>
                      <input required value={form.trip_destination} onChange={e => setForm({...form, trip_destination: e.target.value})} placeholder="Ej. Ayacucho Centro / Huamanga" style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: 8, boxSizing: 'border-box' }}/>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#cbd5e1' }}>Fecha de salida *</label>
                        <input type="datetime-local" required value={form.start_datetime} onChange={e => setForm({...form, start_datetime: e.target.value})} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: 8, boxSizing: 'border-box' }}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#cbd5e1' }}>Fecha de retorno *</label>
                        <input type="datetime-local" required value={form.end_datetime_planned} onChange={e => setForm({...form, end_datetime_planned: e.target.value})} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: 8, boxSizing: 'border-box' }}/>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#cbd5e1' }}>Teléfono *</label>
                        <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="912345678" style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: 8, boxSizing: 'border-box' }}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#cbd5e1' }}>DNI / Pasaporte *</label>
                        <input required value={form.document_number} onChange={e => setForm({...form, document_number: e.target.value})} placeholder="87654321" style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: 8, boxSizing: 'border-box' }}/>
                      </div>
                    </div>
                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #334155' }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#38bdf8' }}>Asegura tu Reserva</h4>
                      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Para garantizar la disponibilidad del vehículo, por favor abona el adelanto o la garantía. Si no abonas, la reserva estará sujeta a disponibilidad.</p>
                      
                      <div style={{ background: '#1e293b', padding: 16, borderRadius: 8, border: '1px solid #334155', marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: '#94a3b8' }}>Yape / Plin:</span> <strong style={{ color: 'white' }}>987 654 321 (Juan Pérez)</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: '#94a3b8' }}>BCP Soles:</span> <strong style={{ color: 'white' }}>191-12345678-0-12</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Interbank Soles:</span> <strong style={{ color: 'white' }}>200-9876543210</strong></div>
                      </div>

                      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#cbd5e1' }}>Monto Abonado (S/) *</label>
                          <input type="number" step="0.01" min="0" value={form.reservation_paid_amount} onChange={e => setForm({...form, reservation_paid_amount: parseFloat(e.target.value)||0})} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: 8, boxSizing: 'border-box' }}/>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#cbd5e1' }}>Medio de Pago</label>
                          <select value={form.payment_method_reservation} onChange={e => setForm({...form, payment_method_reservation: e.target.value})} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: 8, boxSizing: 'border-box' }}>
                            <option value="yape">Yape</option><option value="plin">Plin</option><option value="bank_transfer">Transferencia</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#cbd5e1' }}>Captura del Pago (Opcional)</label>
                        <input type="file" accept="image/*" onChange={handleFileUpload} style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: 8, boxSizing: 'border-box' }}/>
                        {form.operation_code && form.operation_code.startsWith('data:image') && (
                          <div style={{ marginTop: 12 }}>
                            <img src={form.operation_code} alt="Comprobante" style={{ height: 100, borderRadius: 8, objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <button type="submit" disabled={submitting} style={{ width: '100%', padding: 16, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                        {submitting ? 'Enviando reserva...' : 'Confirmar Solicitud de Reserva'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

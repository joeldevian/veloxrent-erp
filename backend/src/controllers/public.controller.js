const supabase = require('../config/supabase');

/**
 * GET /api/public/vehicles
 * Lista vehículos disponibles para mostrar en la web pública
 */
async function getAvailableVehicles(req, res) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, brand, model, type, year, base_price_per_day, extra_km_rate_normal, guarantee_amount, photo_url, accessories')
      .eq('status', 'disponible');

    if (error) throw error;
    res.json({ error: false, data });
  } catch (error) {
    console.error('Error public vehicles:', error);
    res.status(500).json({ error: true, message: 'Error obteniendo catálogo' });
  }
}

/**
 * POST /api/public/reservations
 * Crea una reserva desde la web y el cliente si no existe
 */
async function createReservation(req, res) {
  try {
    const { vehicle_id, start_datetime, end_datetime_planned, trip_destination, client_data, reservation_paid_amount, payment_method_reservation, operation_code } = req.body;

    if (!vehicle_id || !start_datetime || !end_datetime_planned || !client_data || !client_data.document_number) {
      return res.status(400).json({ error: true, message: 'Faltan datos obligatorios' });
    }

    // 1. Verificar disponibilidad del vehículo
    const { data: vehicle } = await supabase.from('vehicles').select('status, guarantee_amount').eq('id', vehicle_id).single();
    if (!vehicle || vehicle.status !== 'disponible') {
      return res.status(409).json({ error: true, message: 'El vehículo no está disponible' });
    }

    // 2. Gestionar Cliente (Buscar o Crear)
    let final_client_id = null;
    const { data: existingClient } = await supabase.from('clients')
      .select('id').eq('document_number', client_data.document_number).single();

    if (existingClient) {
      final_client_id = existingClient.id;
    } else {
      const { data: newClient, error: clientErr } = await supabase.from('clients').insert([{
        full_name: client_data.full_name,
        document_number: client_data.document_number,
        document_type: client_data.document_type || 'dni',
        phone: client_data.phone,
        email: client_data.email || null,
        client_type: 'local',
        client_status: 'prospecto'
      }]).select('id').single();
      
      if (clientErr) throw clientErr;
      final_client_id = newClient.id;
    }

    // 3. Crear el contrato (operator_id = null)
    const contractData = {
      client_id: final_client_id,
      vehicle_id,
      operator_id: null, // Indicador clave de "Reserva Web"
      plan: 'normal',
      start_datetime,
      end_datetime_planned,
      trip_destination,
      reservation_paid_amount: reservation_paid_amount || 0,
      deposit_amount: vehicle.guarantee_amount,
      pending_guarantee_amount: vehicle.guarantee_amount - (reservation_paid_amount || 0),
      payment_method_reservation: payment_method_reservation || null,
      status: 'pending',
      notes: operation_code ? JSON.stringify({ web_payment_receipt: operation_code }) : null
    };

    const { data: newContract, error: contractErr } = await supabase
      .from('contracts').insert([contractData]).select().single();

    if (contractErr) throw contractErr;

    res.status(201).json({ error: false, message: 'Reserva completada exitosamente. Nos comunicaremos con usted.', data: newContract });
  } catch (error) {
    console.error('Error public reservation:', error);
    res.status(500).json({ error: true, message: 'Error al procesar su reserva' });
  }
}

/**
 * GET /api/public/alerts
 * Obtiene el conteo de reservas pendientes vía web para la campanita
 * NOTA: Esta ruta debería estar protegida en producción, pero por simplicidad la ponemos en public, 
 * o idealmente la movemos a contracts.routes.js (haremos esto último).
 * Esta función no se usará aquí si lo movemos.
 */

module.exports = { getAvailableVehicles, createReservation };

const supabase = require('../config/supabase');
const { calcularCostoFinal } = require('../utils/cost-calculator');

/**
 * GET /api/contracts
 */
async function getAll(req, res) {
  try {
    const { status, vehicle_id, client_id } = req.query;
    let query = supabase.from('contracts').select(`
      *,
      clients:client_id(id, full_name, document_number, phone),
      vehicles:vehicle_id(id, brand, model, plate, type),
      operator:operator_id(id, full_name)
    `).order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (vehicle_id) query = query.eq('vehicle_id', vehicle_id);
    if (client_id) query = query.eq('client_id', client_id);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ error: false, data });
  } catch (error) {
    console.error('Error al listar contratos:', error);
    res.status(500).json({ error: true, message: 'Error al obtener contratos' });
  }
}

/**
 * GET /api/contracts/:id
 */
async function getById(req, res) {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        clients:client_id(*),
        vehicles:vehicle_id(*),
        operator:operator_id(id, full_name)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: true, message: 'Contrato no encontrado' });
    }

    // Pagos asociados
    const { data: payments } = await supabase
      .from('payments').select('*').eq('contract_id', data.id);

    // Incidencias
    const { data: incidents } = await supabase
      .from('incidents').select('*').eq('contract_id', data.id);

    res.json({ error: false, data: { ...data, payments: payments || [], incidents: incidents || [] } });
  } catch (error) {
    console.error('Error al obtener contrato:', error);
    res.status(500).json({ error: true, message: 'Error al obtener contrato' });
  }
}

/**
 * GET /api/contracts/alerts/web
 */
async function getWebAlerts(req, res) {
  try {
    const { data, count, error } = await supabase
      .from('contracts')
      .select(`
        id, created_at, start_datetime,
        clients:client_id(full_name),
        vehicles:vehicle_id(brand, model, plate)
      `, { count: 'exact' })
      .eq('status', 'pending')
      .is('operator_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ error: false, count: count || 0, data: data || [] });
  } catch (error) {
    console.error('Error web alerts:', error);
    res.status(500).json({ error: true, count: 0, data: [] });
  }
}

/**
 * POST /api/contracts — Crear reserva
 */
async function create(req, res) {
  try {
    const { client_id, vehicle_id, plan, start_datetime, end_datetime_planned, trip_destination, payment_method_reservation, reservation_paid_amount } = req.body;

    // Verificar disponibilidad del vehículo
    const { data: vehicle } = await supabase
      .from('vehicles').select('*').eq('id', vehicle_id).single();

    if (!vehicle) {
      return res.status(404).json({ error: true, message: 'Vehículo no encontrado' });
    }

    if (vehicle.status !== 'disponible') {
      return res.status(409).json({ error: true, message: 'El vehículo no está disponible' });
    }

    // Verificar que no tenga contrato activo en las mismas fechas
    const { data: conflicting } = await supabase
      .from('contracts')
      .select('id')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['active', 'confirmed'])
      .lte('start_datetime', end_datetime_planned)
      .gte('end_datetime_planned', start_datetime);

    if (conflicting && conflicting.length > 0) {
      return res.status(409).json({ error: true, message: 'El vehículo ya tiene un contrato en esas fechas' });
    }

    const contractData = {
      client_id,
      vehicle_id,
      operator_id: req.user?.userId || null,
      plan: plan || 'normal',
      start_datetime,
      end_datetime_planned,
      trip_destination,
      reservation_paid_amount: reservation_paid_amount || 0,
      deposit_amount: vehicle.guarantee_amount,
      pending_guarantee_amount: vehicle.guarantee_amount - (reservation_paid_amount || 0),
      payment_method_reservation: payment_method_reservation || null,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('contracts').insert([contractData]).select().single();

    if (error) throw error;

    // Registrar el pago en la tabla de payments si hay un monto
    if (reservation_paid_amount > 0) {
      await supabase.from('payments').insert([{
        contract_id: data.id,
        type: 'reservation',
        amount: reservation_paid_amount,
        payment_method: payment_method_reservation || 'cash',
        operation_code: req.body.operation_code || null,
        registered_by: req.user?.userId || null
      }]);
    }

    res.status(201).json({ error: false, message: 'Reserva creada exitosamente', data });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: true, message: 'Error al crear reserva' });
  }
}

/**
 * PUT /api/contracts/:id/confirm — Confirmar reserva
 */
async function confirm(req, res) {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .update({ status: 'confirmed', operator_id: req.user.userId, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(400).json({ error: true, message: 'Contrato no encontrado o no está pendiente' });

    res.json({ error: false, message: 'Reserva confirmada', data });
  } catch (error) {
    console.error('Error al confirmar:', error);
    res.status(500).json({ error: true, message: 'Error al confirmar reserva' });
  }
}

/**
 * PUT /api/contracts/:id/open — Apertura presencial
 */
async function open(req, res) {
  try {
    const { km_start, fuel_level_start, photo_start_url, policies_accepted, policies_version } = req.body;

    // Validar campos obligatorios
    if (!km_start && km_start !== 0) {
      return res.status(400).json({ error: true, message: 'Kilómetros de salida es obligatorio' });
    }
    if (!fuel_level_start) {
      return res.status(400).json({ error: true, message: 'Nivel de combustible de salida es obligatorio' });
    }
    if (!photo_start_url) {
      return res.status(400).json({ error: true, message: 'Foto del tablero de salida es obligatoria' });
    }

    // Obtener contrato
    const { data: contract } = await supabase
      .from('contracts').select('*, vehicles:vehicle_id(*)').eq('id', req.params.id).single();

    if (!contract || !['pending', 'confirmed'].includes(contract.status)) {
      return res.status(400).json({ error: true, message: 'Contrato no encontrado o no se puede abrir' });
    }

    // Verificar vehículo disponible
    if (contract.vehicles.status !== 'disponible') {
      return res.status(409).json({ error: true, message: 'El vehículo no está disponible actualmente' });
    }

    // Actualizar contrato
    const { data, error } = await supabase
      .from('contracts')
      .update({
        status: 'active',
        km_start,
        fuel_level_start,
        photo_start_url,
        start_datetime: new Date().toISOString(),
        policies_accepted: policies_accepted || true,
        policies_version: policies_version || '1.0',
        operator_id: req.user.userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Marcar vehículo como alquilado
    await supabase
      .from('vehicles')
      .update({ status: 'alquilado', current_km: km_start, current_fuel_level: fuel_level_start, updated_at: new Date().toISOString() })
      .eq('id', contract.vehicle_id);

    // Actualizar estado del cliente a activo
    await supabase
      .from('clients')
      .update({ client_status: 'activo', updated_at: new Date().toISOString() })
      .eq('id', contract.client_id);

    res.json({ error: false, message: 'Contrato abierto exitosamente', data });
  } catch (error) {
    console.error('Error al abrir contrato:', error);
    res.status(500).json({ error: true, message: 'Error al abrir contrato' });
  }
}

/**
 * PUT /api/contracts/:id/close — Cerrar contrato
 */
async function close(req, res) {
  try {
    const { km_end, fuel_level_end, photo_end_url, incident_charge, voucher_type, payment_method_final, client_ruc, client_business_name, client_fiscal_address } = req.body;

    // Obtener contrato con vehículo
    const { data: contract } = await supabase
      .from('contracts')
      .select('*, vehicles:vehicle_id(*)')
      .eq('id', req.params.id)
      .single();

    if (!contract || contract.status !== 'active') {
      return res.status(400).json({ error: true, message: 'Contrato no encontrado o no está activo' });
    }

    // Calcular costo final
    const costoData = {
      ...contract,
      km_end,
      fuel_level_end,
      end_datetime_actual: new Date().toISOString(),
      incident_charge: incident_charge || 0
    };

    const costoFinal = calcularCostoFinal(costoData, contract.vehicles);

    // Actualizar contrato
    const { data, error } = await supabase
      .from('contracts')
      .update({
        status: 'closed',
        km_end,
        fuel_level_end,
        photo_end_url,
        end_datetime_actual: new Date().toISOString(),
        base_amount: costoFinal.base_amount,
        extra_km_charge: costoFinal.extra_km_charge,
        fuel_charge: costoFinal.fuel_charge,
        incident_charge: costoFinal.incident_charge,
        total_amount: costoFinal.total_amount,
        voucher_type,
        payment_method_final,
        client_ruc,
        client_business_name,
        client_fiscal_address,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Liberar vehículo
    await supabase
      .from('vehicles')
      .update({
        status: 'disponible',
        current_km: km_end,
        current_fuel_level: fuel_level_end,
        updated_at: new Date().toISOString()
      })
      .eq('id', contract.vehicle_id);

    // Verificar si cliente es recurrente (3+ contratos cerrados)
    const { data: closedContracts } = await supabase
      .from('contracts')
      .select('id')
      .eq('client_id', contract.client_id)
      .eq('status', 'closed');

    if (closedContracts && closedContracts.length >= 3) {
      await supabase
        .from('clients')
        .update({ client_status: 'recurrente', updated_at: new Date().toISOString() })
        .eq('id', contract.client_id);
    }

    res.json({
      error: false,
      message: 'Contrato cerrado exitosamente',
      data: { ...data, calculo: costoFinal }
    });
  } catch (error) {
    console.error('Error al cerrar contrato:', error);
    res.status(500).json({ error: true, message: 'Error al cerrar contrato' });
  }
}

/**
 * PUT /api/contracts/:id/cancel — Cancelar contrato (solo admin)
 */
async function cancel(req, res) {
  try {
    const { reason } = req.body;
    const { data, error } = await supabase
      .from('contracts')
      .update({ status: 'cancelled', notes: reason || 'Cancelado por administrador', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .in('status', ['pending', 'confirmed'])
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(400).json({ error: true, message: 'No se puede cancelar este contrato' });

    res.json({ error: false, message: 'Contrato cancelado', data });
  } catch (error) {
    console.error('Error al cancelar:', error);
    res.status(500).json({ error: true, message: 'Error al cancelar contrato' });
  }
}

module.exports = { getAll, getById, getWebAlerts, create, confirm, open, close, cancel };

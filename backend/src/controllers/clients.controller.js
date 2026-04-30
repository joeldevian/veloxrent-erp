const supabase = require('../config/supabase');

/**
 * GET /api/clients
 */
async function getAll(req, res) {
  try {
    const { client_type, client_status, search } = req.query;
    let query = supabase.from('clients').select('*').order('created_at', { ascending: false });

    if (client_type) query = query.eq('client_type', client_type);
    if (client_status) query = query.eq('client_status', client_status);
    if (search) query = query.or(`full_name.ilike.%${search}%,document_number.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ error: false, data });
  } catch (error) {
    console.error('Error al listar clientes:', error);
    res.status(500).json({ error: true, message: 'Error al obtener clientes' });
  }
}

/**
 * GET /api/clients/:id — Ficha 360°
 */
async function getById(req, res) {
  try {
    const { id } = req.params;

    // Datos del cliente
    const { data: client, error: cError } = await supabase
      .from('clients').select('*').eq('id', id).single();
    if (cError || !client) {
      return res.status(404).json({ error: true, message: 'Cliente no encontrado' });
    }

    // Historial de contratos
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, vehicle_id, plan, start_datetime, end_datetime_actual, total_amount, status, trip_destination')
      .eq('client_id', id)
      .order('created_at', { ascending: false });

    // Interacciones
    const { data: interactions } = await supabase
      .from('client_interactions')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Incidencias a través de contratos
    const contractIds = (contracts || []).map(c => c.id);
    let incidents = [];
    if (contractIds.length > 0) {
      const { data: inc } = await supabase
        .from('incidents')
        .select('*')
        .in('contract_id', contractIds);
      incidents = inc || [];
    }

    // Calcular estadísticas
    const closedContracts = (contracts || []).filter(c => c.status === 'closed');
    const totalAcumulado = closedContracts.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0);

    // Vehículo más usado
    const vehicleCount = {};
    closedContracts.forEach(c => {
      vehicleCount[c.vehicle_id] = (vehicleCount[c.vehicle_id] || 0) + 1;
    });
    const vehiculoFavorito = Object.entries(vehicleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Destinos más frecuentes
    const destCount = {};
    closedContracts.forEach(c => {
      if (c.trip_destination) {
        destCount[c.trip_destination] = (destCount[c.trip_destination] || 0) + 1;
      }
    });
    const destinosFrecuentes = Object.entries(destCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([dest, count]) => ({ destino: dest, cantidad: count }));

    res.json({
      error: false,
      data: {
        ...client,
        contracts: contracts || [],
        interactions: interactions || [],
        incidents,
        stats: {
          total_acumulado: Math.round(totalAcumulado * 100) / 100,
          total_contratos: closedContracts.length,
          vehiculo_favorito: vehiculoFavorito,
          destinos_frecuentes: destinosFrecuentes
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: true, message: 'Error al obtener cliente' });
  }
}

/**
 * POST /api/clients
 */
async function create(req, res) {
  try {
    const clientData = req.body;

    // Validar garante obligatorio para foráneos y extranjeros
    if (['foraneo', 'extranjero'].includes(clientData.client_type)) {
      if (!clientData.guarantor_full_name || !clientData.guarantor_phone || !clientData.guarantor_document_number) {
        return res.status(400).json({
          error: true,
          message: 'Datos del garante son obligatorios para clientes foráneos y extranjeros'
        });
      }
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...clientData, client_status: 'prospecto' }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: true, message: 'Ya existe un cliente con ese documento' });
      }
      throw error;
    }

    res.status(201).json({ error: false, message: 'Cliente creado exitosamente', data });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: true, message: 'Error al crear cliente' });
  }
}

/**
 * PUT /api/clients/:id
 */
async function update(req, res) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: true, message: 'Cliente no encontrado' });

    res.json({ error: false, message: 'Cliente actualizado', data });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: true, message: 'Error al actualizar cliente' });
  }
}

/**
 * PUT /api/clients/:id/status — Cambiar estado CRM
 */
async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { new_status, reason } = req.body;

    // Obtener estado actual
    const { data: client } = await supabase
      .from('clients').select('client_status').eq('id', id).single();

    if (!client) {
      return res.status(404).json({ error: true, message: 'Cliente no encontrado' });
    }

    // Actualizar estado
    const { error: updateError } = await supabase
      .from('clients')
      .update({ client_status: new_status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) throw updateError;

    // Registrar en log
    await supabase.from('client_status_log').insert([{
      client_id: id,
      previous_status: client.client_status,
      new_status,
      reason: reason || '',
      changed_by: req.user.userId
    }]);

    res.json({ error: false, message: `Estado cambiado a ${new_status}` });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: true, message: 'Error al cambiar estado del cliente' });
  }
}

module.exports = { getAll, getById, create, update, updateStatus };

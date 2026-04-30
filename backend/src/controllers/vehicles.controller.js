const supabase = require('../config/supabase');

/**
 * GET /api/vehicles
 * Lista todos los vehículos con filtros opcionales
 */
async function getAll(req, res) {
  try {
    const { type, status, fuel_type } = req.query;
    let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (fuel_type) query = query.eq('fuel_type', fuel_type);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ error: false, data });
  } catch (error) {
    console.error('Error al listar vehículos:', error);
    res.status(500).json({ error: true, message: 'Error al obtener vehículos' });
  }
}

/**
 * GET /api/vehicles/available
 * Vehículos disponibles en un rango de fechas
 */
async function getAvailable(req, res) {
  try {
    const { from, to } = req.query;

    // Obtener vehículos que no tienen contratos activos en el rango
    const { data: vehicles, error: vError } = await supabase
      .from('vehicles')
      .select('*')
      .in('status', ['disponible']);

    if (vError) throw vError;

    if (from && to) {
      // Filtrar los que no tienen contratos activos en el rango de fechas
      const { data: activeContracts, error: cError } = await supabase
        .from('contracts')
        .select('vehicle_id')
        .in('status', ['active', 'confirmed'])
        .lte('start_datetime', to)
        .gte('end_datetime_planned', from);

      if (cError) throw cError;

      const occupiedIds = new Set(activeContracts.map(c => c.vehicle_id));
      const available = vehicles.filter(v => !occupiedIds.has(v.id));
      return res.json({ error: false, data: available });
    }

    res.json({ error: false, data: vehicles });
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    res.status(500).json({ error: true, message: 'Error al obtener disponibilidad' });
  }
}

/**
 * GET /api/vehicles/:id
 */
async function getById(req, res) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: true, message: 'Vehículo no encontrado' });
    }

    res.json({ error: false, data });
  } catch (error) {
    console.error('Error al obtener vehículo:', error);
    res.status(500).json({ error: true, message: 'Error al obtener vehículo' });
  }
}

/**
 * POST /api/vehicles
 */
async function create(req, res) {
  try {
    const vehicleData = req.body;
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: true, message: 'Ya existe un vehículo con esa placa' });
      }
      throw error;
    }

    res.status(201).json({ error: false, message: 'Vehículo creado exitosamente', data });
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    res.status(500).json({ error: true, message: 'Error al crear vehículo' });
  }
}

/**
 * PUT /api/vehicles/:id
 */
async function update(req, res) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: true, message: 'Vehículo no encontrado' });

    res.json({ error: false, message: 'Vehículo actualizado', data });
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    res.status(500).json({ error: true, message: 'Error al actualizar vehículo' });
  }
}

/**
 * DELETE /api/vehicles/:id
 * Desactiva el vehículo (soft delete cambiando estado)
 */
async function remove(req, res) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ status: 'fuera_de_servicio', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: true, message: 'Vehículo no encontrado' });

    res.json({ error: false, message: 'Vehículo desactivado', data });
  } catch (error) {
    console.error('Error al desactivar vehículo:', error);
    res.status(500).json({ error: true, message: 'Error al desactivar vehículo' });
  }
}

/**
 * Obtiene alertas de vehículos con SOAT/seguro próximo a vencer
 */
async function getAlerts(req, res) {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const limitDate = thirtyDaysFromNow.toISOString().split('T')[0];

    const { data: soatAlerts, error: e1 } = await supabase
      .from('vehicles')
      .select('id, brand, model, plate, soat_expiry')
      .lte('soat_expiry', limitDate)
      .neq('status', 'fuera_de_servicio');

    const { data: insuranceAlerts, error: e2 } = await supabase
      .from('vehicles')
      .select('id, brand, model, plate, insurance_expiry')
      .lte('insurance_expiry', limitDate)
      .neq('status', 'fuera_de_servicio');

    if (e1) throw e1;
    if (e2) throw e2;

    res.json({
      error: false,
      data: {
        soat_alerts: soatAlerts || [],
        insurance_alerts: insuranceAlerts || []
      }
    });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ error: true, message: 'Error al obtener alertas' });
  }
}

module.exports = { getAll, getAvailable, getById, create, update, remove, getAlerts };

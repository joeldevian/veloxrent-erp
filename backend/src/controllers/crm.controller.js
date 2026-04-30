const supabase = require('../config/supabase');

async function getPipeline(req, res) {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select(`*, clients:client_id(id, full_name, phone), vehicles:vehicle_id(id, brand, model, plate)`)
      .in('status', ['pending', 'confirmed', 'active', 'closed'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const pipeline = {
      solicitud_recibida: (data || []).filter(c => c.status === 'pending'),
      contactado: (data || []).filter(c => c.status === 'confirmed'),
      contrato_abierto: (data || []).filter(c => c.status === 'active'),
      contrato_cerrado: (data || []).filter(c => c.status === 'closed')
    };

    res.json({ error: false, data: pipeline });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al obtener pipeline' });
  }
}

async function getInactive(req, res) {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: clients } = await supabase
      .from('clients')
      .select('id, full_name, phone, client_status, updated_at')
      .eq('client_status', 'inactivo');

    // Clientes activos/recurrentes sin contrato reciente
    const { data: activeClients } = await supabase
      .from('clients')
      .select('id, full_name, phone, client_status')
      .in('client_status', ['activo', 'recurrente']);

    let inactiveList = [...(clients || [])];

    for (const client of (activeClients || [])) {
      const { data: lastContract } = await supabase
        .from('contracts')
        .select('created_at')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastContract || new Date(lastContract.created_at) < ninetyDaysAgo) {
        inactiveList.push(client);
      }
    }

    res.json({ error: false, data: inactiveList });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al obtener clientes inactivos' });
  }
}

async function createInteraction(req, res) {
  try {
    const { client_id, channel, summary, next_action, next_action_date } = req.body;
    const { data, error } = await supabase.from('client_interactions').insert([{
      client_id, operator_id: req.user.userId, channel, summary, next_action, next_action_date
    }]).select().single();

    if (error) throw error;
    res.status(201).json({ error: false, message: 'Interacción registrada', data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al registrar interacción' });
  }
}

async function getTimeline(req, res) {
  try {
    const { data, error } = await supabase
      .from('client_interactions')
      .select('*, operator:operator_id(full_name)')
      .eq('client_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ error: false, data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al obtener timeline' });
  }
}

module.exports = { getPipeline, getInactive, createInteraction, getTimeline };

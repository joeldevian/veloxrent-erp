const supabase = require('../config/supabase');

async function getAll(req, res) {
  try {
    const { vehicle_id } = req.query;
    let query = supabase.from('maintenance_records').select('*, vehicles:vehicle_id(brand, model, plate, status)').order('date', { ascending: false });
    if (vehicle_id) query = query.eq('vehicle_id', vehicle_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ error: false, data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al obtener registros' });
  }
}

async function create(req, res) {
  try {
    const { data, error } = await supabase.from('maintenance_records').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json({ error: false, message: 'Mantenimiento registrado', data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al registrar mantenimiento' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('maintenance_records').delete().eq('id', id);
    if (error) throw error;
    res.json({ error: false, message: 'Registro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al eliminar registro' });
  }
}

module.exports = { getAll, create, remove };

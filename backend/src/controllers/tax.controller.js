const supabase = require('../config/supabase');

async function getConfig(req, res) {
  try {
    const { data, error } = await supabase.from('tax_config').select('id, ruc, business_name, fiscal_address, igv_rate, invoice_series, receipt_series, pse_provider, pse_api_url, certificate_expiry, updated_at').single();
    if (error) throw error;
    res.json({ error: false, data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al obtener configuración' });
  }
}

async function updateConfig(req, res) {
  try {
    const { id, ...updateData } = req.body;
    const { data: existing } = await supabase.from('tax_config').select('id').single();
    if (!existing) return res.status(404).json({ error: true, message: 'Configuración no encontrada' });

    const { data, error } = await supabase.from('tax_config')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', existing.id).select().single();

    if (error) throw error;
    res.json({ error: false, message: 'Configuración actualizada', data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al actualizar configuración' });
  }
}

module.exports = { getConfig, updateConfig };

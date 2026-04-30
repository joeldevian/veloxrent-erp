const supabase = require('../config/supabase');

async function income(req, res) {
  try {
    const { from, to } = req.query;
    let query = supabase.from('contracts').select('total_amount, vehicle_id, payment_method_final, created_at').eq('status', 'closed');
    if (from) query = query.gte('end_datetime_actual', from);
    if (to) query = query.lte('end_datetime_actual', to);

    const { data, error } = await query;
    if (error) throw error;

    const totalIncome = (data || []).reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);
    res.json({ error: false, data: { total: Math.round(totalIncome * 100) / 100, contracts: data } });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al generar reporte de ingresos' });
  }
}

async function fleet(req, res) {
  try {
    const { from, to } = req.query;
    const { data: vehicles } = await supabase.from('vehicles').select('id, brand, model, plate, status');
    const { data: contracts } = await supabase.from('contracts').select('vehicle_id, start_datetime, end_datetime_actual').eq('status', 'closed');

    const fleetReport = (vehicles || []).map(v => {
      const vehicleContracts = (contracts || []).filter(c => c.vehicle_id === v.id);
      const daysRented = vehicleContracts.reduce((sum, c) => {
        const start = new Date(c.start_datetime);
        const end = new Date(c.end_datetime_actual || c.start_datetime);
        return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      }, 0);
      return { ...v, days_rented: daysRented, total_contracts: vehicleContracts.length };
    });

    res.json({ error: false, data: fleetReport });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al generar reporte de flota' });
  }
}

async function paymentMethods(req, res) {
  try {
    const { from, to } = req.query;
    let query = supabase.from('payments').select('amount, payment_method, created_at');
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error } = await query;
    if (error) throw error;

    const summary = {};
    (data || []).forEach(p => {
      summary[p.payment_method] = (summary[p.payment_method] || 0) + parseFloat(p.amount);
    });

    res.json({ error: false, data: summary });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al generar reporte' });
  }
}

async function vouchersReport(req, res) {
  try {
    const { from, to } = req.query;
    let query = supabase.from('vouchers').select('type, status, total, igv_amount, issue_date');
    if (from) query = query.gte('issue_date', from);
    if (to) query = query.lte('issue_date', to);

    const { data, error } = await query;
    if (error) throw error;

    const totalIGV = (data || []).filter(v => v.status === 'accepted').reduce((s, v) => s + (parseFloat(v.igv_amount) || 0), 0);
    const receipts = (data || []).filter(v => v.type === 'receipt').length;
    const invoices = (data || []).filter(v => v.type === 'invoice').length;

    res.json({ error: false, data: { total_igv: totalIGV, receipts_count: receipts, invoices_count: invoices, vouchers: data } });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al generar reporte tributario' });
  }
}

async function crmReport(req, res) {
  try {
    const { data: total } = await supabase.from('contracts').select('id', { count: 'exact' });
    const { data: closed } = await supabase.from('contracts').select('id', { count: 'exact' }).eq('status', 'closed');
    const { data: newClients } = await supabase.from('clients').select('id', { count: 'exact' });

    res.json({
      error: false,
      data: {
        total_reservas: total?.length || 0,
        contratos_cerrados: closed?.length || 0,
        conversion_rate: total?.length ? ((closed?.length || 0) / total.length * 100).toFixed(1) : 0,
        total_clientes: newClients?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al generar reporte CRM' });
  }
}

module.exports = { income, fleet, paymentMethods, vouchersReport, crmReport };

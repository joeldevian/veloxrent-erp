const supabase = require('../config/supabase');

async function getAll(req, res) {
  try {
    const { contract_id, date, payment_method } = req.query;
    let query = supabase.from('payments').select(`
      *,
      contracts:contract_id(id, vehicle_id, client_id),
      registered:registered_by(id, full_name)
    `).order('created_at', { ascending: false });

    if (contract_id) query = query.eq('contract_id', contract_id);
    if (payment_method) query = query.eq('payment_method', payment_method);
    if (date) query = query.gte('created_at', `${date}T00:00:00`).lte('created_at', `${date}T23:59:59`);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ error: false, data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al obtener pagos' });
  }
}

async function create(req, res) {
  try {
    const { contract_id, type, amount, payment_method, operation_code, card_last_four, notes } = req.body;

    // Validar operation_code para yape/plin
    if (['yape', 'plin'].includes(payment_method) && !operation_code) {
      return res.status(400).json({ error: true, message: 'Número de operación obligatorio para Yape/Plin' });
    }
    if (['card_debit', 'card_credit'].includes(payment_method) && !card_last_four) {
      return res.status(400).json({ error: true, message: 'Últimos 4 dígitos obligatorios para tarjeta' });
    }

    const { data, error } = await supabase.from('payments').insert([{
      contract_id, type, amount, payment_method, operation_code, card_last_four,
      registered_by: req.user.userId, notes
    }]).select().single();

    if (error) throw error;
    res.status(201).json({ error: false, message: 'Pago registrado', data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al registrar pago' });
  }
}

async function cashClose(req, res) {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .gte('created_at', `${targetDate}T00:00:00`)
      .lte('created_at', `${targetDate}T23:59:59`);

    if (error) throw error;

    const summary = { cash: 0, yape: 0, plin: 0, card_debit: 0, card_credit: 0, bank_transfer: 0, total: 0 };
    (data || []).forEach(p => {
      if (summary.hasOwnProperty(p.payment_method)) {
        summary[p.payment_method] += parseFloat(p.amount);
      }
      summary.total += parseFloat(p.amount);
    });

    res.json({ error: false, data: { date: targetDate, payments: data, summary } });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al generar cierre de caja' });
  }
}

module.exports = { getAll, create, cashClose };

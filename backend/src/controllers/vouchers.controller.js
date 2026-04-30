const supabase = require('../config/supabase');
const { calcularIGV } = require('../utils/cost-calculator');
const axios = require('axios');
const config = require('../config/env');

async function emitReceipt(req, res) {
  try {
    const { contract_id } = req.body;
    const { data: contract } = await supabase.from('contracts').select('*, vehicles:vehicle_id(*), clients:client_id(*)').eq('id', contract_id).single();
    if (!contract) return res.status(404).json({ error: true, message: 'Contrato no encontrado' });

    const igvData = calcularIGV(contract.total_amount);
    const description = `Servicio de alquiler de vehículo — ${contract.vehicles.brand} ${contract.vehicles.model} ${contract.vehicles.year}, Placa ${contract.vehicles.plate} — Plan ${contract.plan} — ${contract.base_amount > 0 ? Math.ceil(contract.base_amount / contract.vehicles.base_price_per_day) : 1} días`;

    // Obtener configuración tributaria
    const { data: taxConfig } = await supabase.from('tax_config').select('*').single();
    const series = taxConfig?.receipt_series || 'B001';

    // Obtener último número
    const { data: lastVoucher } = await supabase.from('vouchers').select('number').eq('series', series).order('number', { ascending: false }).limit(1).single();
    const nextNumber = (lastVoucher?.number || 0) + 1;

    const voucherData = {
      contract_id,
      type: 'receipt',
      series,
      number: nextNumber,
      issue_date: new Date().toISOString().split('T')[0],
      subtotal: igvData.subtotal,
      igv_amount: igvData.igv_amount,
      total: igvData.total,
      service_description: description,
      status: 'draft',
      created_by: req.user.userId
    };

    // Intentar enviar a Nubefact si hay token configurado
    if (config.nubefact.apiToken) {
      try {
        const nubefactPayload = {
          operacion: 'generar_comprobante',
          tipo_de_comprobante: 2,
          serie: series,
          numero: nextNumber,
          sunat_transaction: 1,
          cliente_tipo_de_documento: 1,
          cliente_numero_de_documento: contract.clients.document_number,
          cliente_denominacion: contract.clients.full_name,
          fecha_de_emision: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('-'),
          moneda: 1,
          porcentaje_de_igv: 18,
          total_gravada: igvData.subtotal,
          total_igv: igvData.igv_amount,
          total: igvData.total,
          items: [{ unidad_de_medida: 'ZZ', codigo: 'SRV-ALQ', descripcion: description, cantidad: 1, valor_unitario: igvData.subtotal, precio_unitario: igvData.total, igv: igvData.igv_amount, total: igvData.total }]
        };

        const response = await axios.post(config.nubefact.apiUrl, nubefactPayload, {
          headers: { Authorization: `Bearer ${config.nubefact.apiToken}`, 'Content-Type': 'application/json' }
        });

        voucherData.status = 'accepted';
        voucherData.xml_url = response.data.enlace_del_xml;
        voucherData.pdf_url = response.data.enlace_del_pdf;
        voucherData.cdr_url = response.data.enlace_del_cdr;
        voucherData.sunat_response_code = response.data.sunat_description;
      } catch (nubefactError) {
        console.error('Error Nubefact:', nubefactError.response?.data || nubefactError.message);
        voucherData.status = 'rejected';
        voucherData.sunat_response_code = nubefactError.response?.data?.errors || 'Error de conexión';
      }
    }

    const { data, error } = await supabase.from('vouchers').insert([voucherData]).select().single();
    if (error) throw error;

    res.status(201).json({ error: false, message: `Boleta ${series}-${nextNumber} emitida`, data });
  } catch (error) {
    console.error('Error al emitir boleta:', error);
    res.status(500).json({ error: true, message: 'Error al emitir boleta' });
  }
}

async function emitInvoice(req, res) {
  try {
    const { contract_id, client_ruc, client_business_name, client_fiscal_address } = req.body;
    if (!client_ruc || !client_business_name) {
      return res.status(400).json({ error: true, message: 'RUC y razón social son obligatorios para factura' });
    }

    const { data: contract } = await supabase.from('contracts').select('*, vehicles:vehicle_id(*), clients:client_id(*)').eq('id', contract_id).single();
    if (!contract) return res.status(404).json({ error: true, message: 'Contrato no encontrado' });

    const igvData = calcularIGV(contract.total_amount);
    const description = `Servicio de alquiler de vehículo — ${contract.vehicles.brand} ${contract.vehicles.model} ${contract.vehicles.year}, Placa ${contract.vehicles.plate} — Plan ${contract.plan}`;

    const { data: taxConfig } = await supabase.from('tax_config').select('*').single();
    const series = taxConfig?.invoice_series || 'F001';
    const { data: lastVoucher } = await supabase.from('vouchers').select('number').eq('series', series).order('number', { ascending: false }).limit(1).single();
    const nextNumber = (lastVoucher?.number || 0) + 1;

    const voucherData = {
      contract_id, type: 'invoice', series, number: nextNumber,
      issue_date: new Date().toISOString().split('T')[0],
      subtotal: igvData.subtotal, igv_amount: igvData.igv_amount, total: igvData.total,
      service_description: description, status: 'draft', created_by: req.user.userId
    };

    const { data, error } = await supabase.from('vouchers').insert([voucherData]).select().single();
    if (error) throw error;

    res.status(201).json({ error: false, message: `Factura ${series}-${nextNumber} emitida`, data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al emitir factura' });
  }
}

async function getAll(req, res) {
  try {
    const { type, status, from, to } = req.query;
    let query = supabase.from('vouchers').select('*, contracts:contract_id(client_id, vehicle_id)').order('created_at', { ascending: false });
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (from) query = query.gte('issue_date', from);
    if (to) query = query.lte('issue_date', to);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ error: false, data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al obtener comprobantes' });
  }
}

async function creditNote(req, res) {
  try {
    const { id } = req.params;
    const { data: original } = await supabase.from('vouchers').select('*').eq('id', id).single();
    if (!original) return res.status(404).json({ error: true, message: 'Comprobante no encontrado' });

    const { data, error } = await supabase.from('vouchers').insert([{
      contract_id: original.contract_id, type: 'credit_note', series: original.series, number: original.number,
      issue_date: new Date().toISOString().split('T')[0],
      subtotal: -original.subtotal, igv_amount: -original.igv_amount, total: -original.total,
      service_description: `Nota de crédito - Ref: ${original.series}-${original.number}`,
      status: 'draft', created_by: req.user.userId
    }]).select().single();

    if (error) throw error;
    await supabase.from('vouchers').update({ status: 'cancelled' }).eq('id', id);
    res.status(201).json({ error: false, message: 'Nota de crédito emitida', data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al emitir nota de crédito' });
  }
}

async function resend(req, res) {
  res.json({ error: false, message: 'Funcionalidad de reenvío por correo pendiente de implementación' });
}

module.exports = { emitReceipt, emitInvoice, getAll, creditNote, resend };

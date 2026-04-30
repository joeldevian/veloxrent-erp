/**
 * Calcula los días reales entre dos fechas considerando horas
 * Redondea hacia arriba: cualquier hora parcial cuenta como día completo
 */
function calcularDiasReales(startDatetime, endDatetime) {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.ceil(diffHours / 24);
}

/**
 * Convierte nivel de combustible a valor numérico (cuartos de tanque)
 */
function fuelLevelToNumber(level) {
  const map = { 'vacio': 0, '1/4': 1, '1/2': 2, '3/4': 3, 'lleno': 4 };
  return map[level] ?? 0;
}

/**
 * Calcula el cargo por diferencia de combustible
 * @param {string} fuelStart - Nivel al inicio
 * @param {string} fuelEnd - Nivel al cierre
 * @param {number} tarifaPorCuarto - Tarifa por cada cuarto de tanque faltante (default S/ 25.00)
 */
function calcularCargoCombustible(fuelStart, fuelEnd, tarifaPorCuarto = 25.00) {
  const startVal = fuelLevelToNumber(fuelStart);
  const endVal = fuelLevelToNumber(fuelEnd);
  const diff = startVal - endVal;
  return diff > 0 ? diff * tarifaPorCuarto : 0;
}

/**
 * Calcula el costo final del alquiler según el plan
 */
function calcularCostoFinal(contrato, vehiculo) {
  const diasReales = calcularDiasReales(contrato.start_datetime, contrato.end_datetime_actual);
  const kmRecorridos = (contrato.km_end || 0) - (contrato.km_start || 0);

  let baseAmount = 0;
  let extraKmCharge = 0;

  switch (contrato.plan) {
    case 'normal': {
      const kmIncluidos = vehiculo.km_plan_normal * diasReales;
      const kmExtra = Math.max(0, kmRecorridos - kmIncluidos);
      baseAmount = vehiculo.base_price_per_day * diasReales;
      extraKmCharge = kmExtra * vehiculo.extra_km_rate_normal;
      break;
    }
    case 'plus': {
      const kmIncluidos = vehiculo.km_plan_plus * diasReales;
      const kmExtra = Math.max(0, kmRecorridos - kmIncluidos);
      baseAmount = vehiculo.plus_plan_price * diasReales;
      extraKmCharge = kmExtra * vehiculo.extra_km_rate_plus;
      break;
    }
    case 'libre': {
      baseAmount = vehiculo.libre_plan_price * diasReales;
      extraKmCharge = 0;
      break;
    }
  }

  const fuelCharge = calcularCargoCombustible(
    contrato.fuel_level_start,
    contrato.fuel_level_end
  );

  const incidentCharge = parseFloat(contrato.incident_charge) || 0;
  const totalAmount = baseAmount + extraKmCharge + fuelCharge + incidentCharge;

  return {
    dias_reales: diasReales,
    km_recorridos: kmRecorridos,
    base_amount: Math.round(baseAmount * 100) / 100,
    extra_km_charge: Math.round(extraKmCharge * 100) / 100,
    fuel_charge: Math.round(fuelCharge * 100) / 100,
    incident_charge: incidentCharge,
    total_amount: Math.round(totalAmount * 100) / 100
  };
}

/**
 * Calcula subtotal e IGV a partir del total (IGV incluido)
 */
function calcularIGV(total, igvRate = 18) {
  const subtotal = total / (1 + igvRate / 100);
  const igvAmount = total - subtotal;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    igv_amount: Math.round(igvAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

module.exports = {
  calcularDiasReales,
  calcularCargoCombustible,
  calcularCostoFinal,
  calcularIGV,
  fuelLevelToNumber
};

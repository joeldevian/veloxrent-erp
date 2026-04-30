-- ============================================
-- Veloxrent ERP — Schema Completo v2.0.0
-- Base de datos PostgreSQL (Supabase)
-- ============================================

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de vehículos
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  plate VARCHAR(10) UNIQUE NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('minivan','sedan','suv','pickup','van')),
  fuel_type VARCHAR(20) NOT NULL CHECK (fuel_type IN ('gasolina','diesel')),
  transmission VARCHAR(20) NOT NULL CHECK (transmission IN ('manual','automatico')),
  traction VARCHAR(10) NOT NULL CHECK (traction IN ('4x2','4x4')),
  color VARCHAR(30),
  seats INTEGER NOT NULL DEFAULT 5,
  base_price_per_day DECIMAL(10,2) NOT NULL,
  plus_plan_price DECIMAL(10,2) NOT NULL,
  libre_plan_price DECIMAL(10,2) NOT NULL,
  km_plan_normal INTEGER NOT NULL DEFAULT 200,
  km_plan_plus INTEGER NOT NULL DEFAULT 300,
  extra_km_rate_normal DECIMAL(5,2) NOT NULL DEFAULT 0.90,
  extra_km_rate_plus DECIMAL(5,2) NOT NULL DEFAULT 0.60,
  guarantee_amount DECIMAL(10,2) NOT NULL DEFAULT 800.00,
  reservation_amount DECIMAL(10,2) NOT NULL DEFAULT 300.00,
  status VARCHAR(20) NOT NULL DEFAULT 'disponible'
    CHECK (status IN ('disponible','alquilado','mantenimiento','fuera_de_servicio')),
  current_km INTEGER NOT NULL DEFAULT 0,
  current_fuel_level VARCHAR(10) NOT NULL DEFAULT 'lleno'
    CHECK (current_fuel_level IN ('vacio','1/4','1/2','3/4','lleno')),
  soat_expiry DATE,
  insurance_expiry DATE,
  accessories JSONB DEFAULT '[]',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(200) NOT NULL,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('dni','pasaporte')),
  document_number VARCHAR(20) UNIQUE NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(100),
  client_type VARCHAR(20) NOT NULL CHECK (client_type IN ('local','foraneo','extranjero','corporativo')),
  client_status VARCHAR(20) NOT NULL DEFAULT 'prospecto'
    CHECK (client_status IN ('prospecto','activo','recurrente','inactivo','bloqueado')),
  is_foreigner BOOLEAN DEFAULT false,
  accommodation_name VARCHAR(150),
  accommodation_address VARCHAR(250),
  accommodation_phone VARCHAR(15),
  temporary_address VARCHAR(250),
  guarantor_full_name VARCHAR(200),
  guarantor_phone VARCHAR(15),
  guarantor_document_number VARCHAR(20),
  guarantor_relationship VARCHAR(30),
  ruc VARCHAR(11),
  business_name VARCHAR(200),
  fiscal_address VARCHAR(300),
  dni_photo_url TEXT,
  license_photo_url TEXT,
  license_years INTEGER,
  utility_bill_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de contratos
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  operator_id UUID REFERENCES users(id),
  plan VARCHAR(10) NOT NULL CHECK (plan IN ('normal','plus','libre')),
  start_datetime TIMESTAMPTZ,
  end_datetime_planned TIMESTAMPTZ,
  end_datetime_actual TIMESTAMPTZ,
  km_start INTEGER,
  km_end INTEGER,
  fuel_level_start VARCHAR(10) CHECK (fuel_level_start IN ('vacio','1/4','1/2','3/4','lleno')),
  fuel_level_end VARCHAR(10) CHECK (fuel_level_end IN ('vacio','1/4','1/2','3/4','lleno')),
  photo_start_url TEXT,
  photo_end_url TEXT,
  trip_destination VARCHAR(250),
  reservation_paid_amount DECIMAL(10,2) DEFAULT 0,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  pending_guarantee_amount DECIMAL(10,2) DEFAULT 0,
  base_amount DECIMAL(10,2) DEFAULT 0,
  extra_km_charge DECIMAL(10,2) DEFAULT 0,
  fuel_charge DECIMAL(10,2) DEFAULT 0,
  incident_charge DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  payment_method_reservation VARCHAR(20),
  payment_method_final VARCHAR(20),
  policies_accepted BOOLEAN DEFAULT false,
  policies_version VARCHAR(10),
  voucher_type VARCHAR(20),
  voucher_series VARCHAR(10),
  voucher_number INTEGER,
  voucher_status VARCHAR(20),
  voucher_xml_url TEXT,
  voucher_pdf_url TEXT,
  voucher_cdr_url TEXT,
  voucher_sunat_code VARCHAR(10),
  client_ruc VARCHAR(11),
  client_business_name VARCHAR(200),
  client_fiscal_address VARCHAR(300),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','active','closed','cancelled','incident')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de comprobantes electrónicos
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('invoice','receipt','credit_note')),
  series VARCHAR(10) NOT NULL,
  number INTEGER NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal DECIMAL(10,2) NOT NULL,
  igv_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  service_description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','accepted','rejected','cancelled')),
  xml_url TEXT,
  pdf_url TEXT,
  cdr_url TEXT,
  sunat_response_code VARCHAR(100),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  voucher_id UUID REFERENCES vouchers(id),
  type VARCHAR(30) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL
    CHECK (payment_method IN ('cash','yape','plin','card_debit','card_credit','bank_transfer')),
  operation_code VARCHAR(50),
  card_last_four VARCHAR(4),
  registered_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración tributaria
CREATE TABLE IF NOT EXISTS tax_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruc VARCHAR(11) NOT NULL,
  business_name VARCHAR(200) NOT NULL,
  fiscal_address VARCHAR(300) NOT NULL,
  igv_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  invoice_series VARCHAR(10) NOT NULL DEFAULT 'F001',
  receipt_series VARCHAR(10) NOT NULL DEFAULT 'B001',
  pse_provider VARCHAR(50) DEFAULT 'nubefact',
  pse_api_key TEXT,
  pse_api_url VARCHAR(200),
  certificate_expiry DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de interacciones CRM
CREATE TABLE IF NOT EXISTS client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  operator_id UUID NOT NULL REFERENCES users(id),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp','call','in_person','email')),
  summary TEXT NOT NULL,
  next_action TEXT,
  next_action_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de log de estados de cliente
CREATE TABLE IF NOT EXISTS client_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  reason TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de incidencias
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  description TEXT NOT NULL,
  damage_photo_url TEXT,
  charge_amount DECIMAL(10,2) DEFAULT 0,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mantenimiento
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  maintenance_type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  provider VARCHAR(150),
  notes TEXT,
  next_km_alert INTEGER,
  next_date_alert DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_vehicle ON contracts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_contract ON vouchers(contract_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_interactions_client ON client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_status_log ON client_status_log(client_id);

-- Seed: Configuración tributaria inicial
INSERT INTO tax_config (ruc, business_name, fiscal_address, igv_rate, invoice_series, receipt_series, pse_provider, pse_api_url)
VALUES ('20613724754', 'VELOXRENT', 'Ayacucho, Perú', 18.00, 'F001', 'B001', 'nubefact', 'https://api.nubefact.com/api/v1')
ON CONFLICT DO NOTHING;

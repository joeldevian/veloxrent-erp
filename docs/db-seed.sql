-- ============================================
-- Veloxrent ERP — Datos de Prueba (Seed masivo)
-- ============================================

-- Habilitar extensión para encriptar contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Limpiar todas las tablas y reiniciar secuencias/UUIDs
TRUNCATE TABLE payments, vouchers, incidents, maintenance_records, client_interactions, client_status_log, contracts, clients, vehicles, users RESTART IDENTITY CASCADE;

-- 2. Insertar Usuarios
-- Contraseñas: admin123 y operador123
INSERT INTO users (id, full_name, email, password_hash, role, is_active) VALUES
  (gen_random_uuid(), 'Admin Principal', 'admin@veloxrentperu.com', crypt('admin123', gen_salt('bf')), 'admin', true),
  (gen_random_uuid(), 'Operador Turno Mañana', 'operador@veloxrentperu.com', crypt('operador123', gen_salt('bf')), 'operator', true);

-- 3. Insertar Vehículos (Flota)
INSERT INTO vehicles (id, brand, model, year, plate, type, fuel_type, transmission, traction, color, seats, base_price_per_day, plus_plan_price, libre_plan_price, guarantee_amount, reservation_amount, status, current_km, current_fuel_level) VALUES
  (gen_random_uuid(), 'Toyota', 'Yaris', 2023, 'ABC-101', 'sedan', 'gasolina', 'manual', '4x2', 'Blanco', 5, 120.00, 150.00, 180.00, 800.00, 300.00, 'disponible', 15000, 'lleno'),
  (gen_random_uuid(), 'Hyundai', 'Accent', 2022, 'DEF-202', 'sedan', 'gasolina', 'manual', '4x2', 'Gris', 5, 110.00, 140.00, 170.00, 800.00, 300.00, 'disponible', 32000, '3/4'),
  (gen_random_uuid(), 'Kia', 'Rio', 2024, 'GHI-303', 'sedan', 'gasolina', 'automatico', '4x2', 'Rojo', 5, 130.00, 160.00, 190.00, 800.00, 300.00, 'alquilado', 8500, '1/2'),
  (gen_random_uuid(), 'Toyota', 'Hilux', 2021, 'JKL-404', 'pickup', 'diesel', 'manual', '4x4', 'Negro', 5, 250.00, 280.00, 320.00, 1500.00, 500.00, 'disponible', 75000, 'lleno'),
  (gen_random_uuid(), 'Nissan', 'Frontier', 2023, 'MNO-505', 'pickup', 'diesel', 'manual', '4x4', 'Plata', 5, 240.00, 270.00, 310.00, 1500.00, 500.00, 'alquilado', 22000, 'lleno'),
  (gen_random_uuid(), 'Hyundai', 'Tucson', 2022, 'PQR-606', 'suv', 'gasolina', 'automatico', '4x2', 'Azul', 5, 180.00, 210.00, 250.00, 1000.00, 400.00, 'disponible', 41000, 'lleno'),
  (gen_random_uuid(), 'Kia', 'Sportage', 2023, 'STU-707', 'suv', 'gasolina', 'automatico', '4x2', 'Blanco', 5, 190.00, 220.00, 260.00, 1000.00, 400.00, 'mantenimiento', 19000, 'vacio'),
  (gen_random_uuid(), 'Toyota', 'Avanza', 2021, 'VWX-808', 'minivan', 'gasolina', 'manual', '4x2', 'Gris Oscuro', 7, 160.00, 190.00, 220.00, 900.00, 350.00, 'disponible', 55000, 'lleno'),
  (gen_random_uuid(), 'Suzuki', 'Ertiga', 2024, 'YZA-909', 'minivan', 'gasolina', 'manual', '4x2', 'Rojo', 7, 170.00, 200.00, 230.00, 900.00, 350.00, 'alquilado', 12000, '1/4'),
  (gen_random_uuid(), 'Renault', 'Master', 2020, 'BCD-111', 'van', 'diesel', 'manual', '4x2', 'Blanco', 15, 300.00, 350.00, 400.00, 2000.00, 800.00, 'disponible', 110000, 'lleno');

-- 4. Insertar Clientes
INSERT INTO clients (id, full_name, document_type, document_number, phone, email, client_type, client_status, ruc, business_name, fiscal_address) VALUES
  (gen_random_uuid(), 'Carlos Mendoza', 'dni', '45879632', '987654321', 'carlos.m@email.com', 'local', 'activo', NULL, NULL, NULL),
  (gen_random_uuid(), 'Ana Gutierrez', 'dni', '74125896', '912345678', 'ana.g@email.com', 'local', 'recurrente', NULL, NULL, NULL),
  (gen_random_uuid(), 'Constructora Sur S.A.C', 'dni', '41236589', '945612378', 'logistica@consur.com', 'corporativo', 'activo', '20123456789', 'Constructora Sur S.A.C', 'Av. Las Americas 123, Ayacucho'),
  (gen_random_uuid(), 'Turismo Andino EIRL', 'dni', '15975346', '978456123', 'reservas@turismoandino.com', 'corporativo', 'recurrente', '20987654321', 'Turismo Andino EIRL', 'Jr. Lima 456, Ayacucho'),
  (gen_random_uuid(), 'Luis Fernando Vargas', 'dni', '75315948', '999888777', 'luis.vargas@email.com', 'foraneo', 'prospecto', NULL, NULL, NULL),
  (gen_random_uuid(), 'Michael Smith', 'pasaporte', 'P1234567', '955444333', 'mike.smith@email.com', 'extranjero', 'activo', NULL, NULL, NULL),
  (gen_random_uuid(), 'Sofia Lujan', 'dni', '46821379', '963852741', 'sofia.l@email.com', 'local', 'inactivo', NULL, NULL, NULL),
  (gen_random_uuid(), 'Empresa Minera XYZ', 'dni', '47125896', '911222333', 'transportes@mineraxyz.com', 'corporativo', 'activo', '20444555666', 'Minera XYZ S.A.', 'Campamento Minero, Ayacucho');

-- 5. Generar Contratos y Data Simulada (Usando variables DO)
DO $$
DECLARE
  v_admin_id UUID;
  v_operator_id UUID;
  v_client_carlos UUID;
  v_client_consur UUID;
  v_client_mike UUID;
  v_client_sofia UUID;
  v_veh_yaris UUID;
  v_veh_hilux UUID;
  v_veh_rio UUID;
  v_veh_ertiga UUID;
  v_contract_1 UUID := gen_random_uuid();
  v_contract_2 UUID := gen_random_uuid();
  v_contract_3 UUID := gen_random_uuid();
  v_contract_4 UUID := gen_random_uuid();
BEGIN
  -- Obtener IDs
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
  SELECT id INTO v_operator_id FROM users WHERE role = 'operator' LIMIT 1;
  SELECT id INTO v_client_carlos FROM clients WHERE document_number = '45879632' LIMIT 1;
  SELECT id INTO v_client_consur FROM clients WHERE ruc = '20123456789' LIMIT 1;
  SELECT id INTO v_client_mike FROM clients WHERE document_number = 'P1234567' LIMIT 1;
  SELECT id INTO v_client_sofia FROM clients WHERE document_number = '46821379' LIMIT 1;
  
  SELECT id INTO v_veh_yaris FROM vehicles WHERE plate = 'ABC-101' LIMIT 1;
  SELECT id INTO v_veh_hilux FROM vehicles WHERE plate = 'JKL-404' LIMIT 1;
  SELECT id INTO v_veh_rio FROM vehicles WHERE plate = 'GHI-303' LIMIT 1;
  SELECT id INTO v_veh_ertiga FROM vehicles WHERE plate = 'YZA-909' LIMIT 1;

  -- CONTRATO 1: CERRADO (Histórico)
  INSERT INTO contracts (id, client_id, vehicle_id, operator_id, plan, start_datetime, end_datetime_planned, end_datetime_actual, km_start, km_end, fuel_level_start, fuel_level_end, status, total_amount, payment_method_final)
  VALUES (v_contract_1, v_client_carlos, v_veh_yaris, v_admin_id, 'normal', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 14500, 14850, 'lleno', 'lleno', 'closed', 240.00, 'yape');

  -- CONTRATO 2: ACTIVO (En curso)
  INSERT INTO contracts (id, client_id, vehicle_id, operator_id, plan, start_datetime, end_datetime_planned, km_start, fuel_level_start, status)
  VALUES (v_contract_2, v_client_consur, v_veh_hilux, v_operator_id, 'libre', NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 74500, 'lleno', 'active');

  -- CONTRATO 3: ACTIVO (En curso)
  INSERT INTO contracts (id, client_id, vehicle_id, operator_id, plan, start_datetime, end_datetime_planned, km_start, fuel_level_start, status)
  VALUES (v_contract_3, v_client_mike, v_veh_rio, v_operator_id, 'plus', NOW() - INTERVAL '1 days', NOW() + INTERVAL '2 days', 8300, '1/2', 'active');

  -- CONTRATO 4: PENDIENTE (Reserva futura)
  INSERT INTO contracts (id, client_id, vehicle_id, operator_id, plan, start_datetime, end_datetime_planned, status, reservation_paid_amount)
  VALUES (v_contract_4, v_client_sofia, v_veh_ertiga, v_operator_id, 'normal', NOW() + INTERVAL '3 days', NOW() + INTERVAL '5 days', 'pending', 350.00);

  -- Insertar algunos pagos
  INSERT INTO payments (contract_id, type, amount, payment_method, registered_by) VALUES
  (v_contract_1, 'final_payment', 240.00, 'yape', v_admin_id),
  (v_contract_2, 'guarantee', 1500.00, 'card_credit', v_operator_id),
  (v_contract_2, 'advance', 1600.00, 'bank_transfer', v_operator_id),
  (v_contract_3, 'advance', 320.00, 'cash', v_operator_id),
  (v_contract_4, 'reservation', 350.00, 'plin', v_operator_id);

  -- Insertar algunos comprobantes
  INSERT INTO vouchers (contract_id, type, series, number, issue_date, subtotal, igv_amount, total, service_description, status, created_by) VALUES
  (v_contract_1, 'receipt', 'B001', 1050, CURRENT_DATE - INTERVAL '8 days', 203.39, 36.61, 240.00, 'Alquiler de vehículo ABC-101 por 2 días', 'accepted', v_admin_id);

  -- Insertar interacciones CRM
  INSERT INTO client_interactions (client_id, operator_id, channel, summary) VALUES
  (v_client_carlos, v_admin_id, 'whatsapp', 'Cliente consultó por renovación, se le ofreció 10% dcto.'),
  (v_client_mike, v_operator_id, 'in_person', 'Extranjero dejó pasaporte original en custodia.');

END $$;

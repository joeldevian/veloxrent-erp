require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function seed() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('🌱 Iniciando seed de Veloxrent ERP...');

  // 1. Crear usuario admin
  const passwordHash = await bcrypt.hash('VeloxAdmin2026!', 10);
  const { data: admin, error: adminError } = await supabase.from('users').upsert([{
    full_name: 'Administrador Veloxrent',
    email: 'admin@veloxrentperu.com',
    password_hash: passwordHash,
    role: 'admin',
    is_active: true
  }], { onConflict: 'email' }).select().single();

  if (adminError) console.error('Error al crear admin:', adminError);
  else console.log('✅ Admin creado:', admin.email);

  // 2. Crear operador de ejemplo
  const opHash = await bcrypt.hash('Operador2026!', 10);
  const { error: opError } = await supabase.from('users').upsert([{
    full_name: 'Operador Veloxrent',
    email: 'operador@veloxrentperu.com',
    password_hash: opHash,
    role: 'operator',
    is_active: true
  }], { onConflict: 'email' });

  if (!opError) console.log('✅ Operador creado: operador@veloxrentperu.com');

  // 3. Insertar flota de vehículos
  const vehicles = [
    { brand: 'Hyundai', model: 'Accent', year: 2020, plate: 'ABC-123', type: 'sedan', fuel_type: 'gasolina', transmission: 'manual', traction: '4x2', color: 'Blanco', seats: 5, base_price_per_day: 120, plus_plan_price: 150, libre_plan_price: 180, guarantee_amount: 800, reservation_amount: 300, current_km: 45000 },
    { brand: 'Toyota', model: 'Hilux', year: 2013, plate: 'DEF-456', type: 'pickup', fuel_type: 'diesel', transmission: 'manual', traction: '4x4', color: 'Negro', seats: 5, base_price_per_day: 180, plus_plan_price: 220, libre_plan_price: 260, guarantee_amount: 1000, reservation_amount: 400, current_km: 120000 },
    { brand: 'Kia', model: 'Sportage', year: 2019, plate: 'GHI-789', type: 'suv', fuel_type: 'gasolina', transmission: 'automatico', traction: '4x2', color: 'Gris', seats: 5, base_price_per_day: 150, plus_plan_price: 180, libre_plan_price: 210, guarantee_amount: 900, reservation_amount: 350, current_km: 60000 },
    { brand: 'Toyota', model: 'Avanza', year: 2021, plate: 'JKL-012', type: 'minivan', fuel_type: 'gasolina', transmission: 'manual', traction: '4x2', color: 'Plata', seats: 7, base_price_per_day: 140, plus_plan_price: 170, libre_plan_price: 200, guarantee_amount: 800, reservation_amount: 300, current_km: 35000 },
    { brand: 'Hyundai', model: 'Tucson', year: 2022, plate: 'MNO-345', type: 'suv', fuel_type: 'gasolina', transmission: 'automatico', traction: '4x4', color: 'Azul', seats: 5, base_price_per_day: 170, plus_plan_price: 200, libre_plan_price: 240, guarantee_amount: 1000, reservation_amount: 400, current_km: 28000 },
  ];

  for (const v of vehicles) {
    const { error } = await supabase.from('vehicles').upsert([v], { onConflict: 'plate' });
    if (!error) console.log(`✅ Vehículo: ${v.brand} ${v.model} (${v.plate})`);
    else console.error(`❌ Error vehículo ${v.plate}:`, error.message);
  }

  console.log('\n🎉 Seed completado!');
  console.log('📧 Admin: admin@veloxrentperu.com / VeloxAdmin2026!');
  console.log('📧 Operador: operador@veloxrentperu.com / Operador2026!');
}

seed().catch(console.error);

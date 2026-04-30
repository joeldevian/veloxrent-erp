module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'veloxrent_default_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'veloxrent-files'
  },
  nubefact: {
    apiUrl: process.env.NUBEFACT_API_URL || 'https://api.nubefact.com/api/v1',
    apiToken: process.env.NUBEFACT_API_TOKEN,
    ruc: process.env.NUBEFACT_RUC || '20613724754'
  }
};

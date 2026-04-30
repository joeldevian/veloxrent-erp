import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para agregar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('veloxrent_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('veloxrent_token');
      localStorage.removeItem('veloxrent_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ========== AUTH ==========
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// ========== VEHICLES ==========
export const vehicleService = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  getAvailable: (from, to) => api.get('/vehicles/available', { params: { from, to } }),
  getAlerts: () => api.get('/vehicles/alerts'),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  remove: (id) => api.delete(`/vehicles/${id}`),
};

// ========== CLIENTS ==========
export const clientService = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  updateStatus: (id, data) => api.put(`/clients/${id}/status`, data),
};

// ========== CONTRACTS ==========
export const contractService = {
  getAll: (params) => api.get('/contracts', { params }),
  getWebAlerts: () => api.get('/contracts/alerts/web'),
  getById: (id) => api.get(`/contracts/${id}`),
  create: (data) => api.post('/contracts', data),
  confirm: (id) => api.put(`/contracts/${id}/confirm`),
  open: (id, data) => api.put(`/contracts/${id}/open`, data),
  close: (id, data) => api.put(`/contracts/${id}/close`, data),
  cancel: (id, data) => api.put(`/contracts/${id}/cancel`, data),
};

// ========== PAYMENTS ==========
export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  cashClose: (date) => api.get('/payments/cashclose', { params: { date } }),
};

// ========== VOUCHERS ==========
export const voucherService = {
  getAll: (params) => api.get('/vouchers', { params }),
  emitReceipt: (data) => api.post('/vouchers/receipt', data),
  emitInvoice: (data) => api.post('/vouchers/invoice', data),
  creditNote: (id) => api.post(`/vouchers/${id}/credit-note`),
  resend: (id) => api.post(`/vouchers/${id}/resend`),
};

// ========== CRM ==========
export const crmService = {
  getPipeline: () => api.get('/crm/pipeline'),
  getInactive: () => api.get('/crm/inactive'),
  createInteraction: (data) => api.post('/crm/interactions', data),
  getTimeline: (clientId) => api.get(`/crm/clients/${clientId}/timeline`),
};

// ========== REPORTS ==========
export const reportService = {
  income: (params) => api.get('/reports/income', { params }),
  fleet: (params) => api.get('/reports/fleet', { params }),
  paymentMethods: (params) => api.get('/reports/payment-methods', { params }),
  vouchers: (params) => api.get('/reports/vouchers', { params }),
  crm: () => api.get('/reports/crm'),
};

// ========== MAINTENANCE ==========
export const maintenanceService = {
  getAll: (params) => api.get('/maintenance', { params }),
  create: (data) => api.post('/maintenance', data),
  remove: (id) => api.delete(`/maintenance/${id}`),
};

// ========== TAX ==========
export const taxService = {
  getConfig: () => api.get('/tax/config'),
  updateConfig: (data) => api.put('/tax/config', data),
};

// ========== USERS ==========
export const userService = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.put(`/users/${id}/deactivate`),
};

// ========== PUBLIC WEB ==========
export const publicService = {
  getAvailableVehicles: () => api.get('/public/vehicles'),
  createReservation: (data) => api.post('/public/reservations', data),
};

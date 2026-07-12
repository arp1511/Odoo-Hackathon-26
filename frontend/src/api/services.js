import api from './client';

export const authApi = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),

  register: (data) =>
    api.post('/api/auth/register', data),

  me: () =>
    api.get('/api/auth/me'),
};

export const dashboardApi = {
  kpis: (params) =>
    api.get('/api/dashboard/kpis', { params }),
};

export const vehiclesApi = {
  list: (params) => api.get('/api/vehicles', { params }),
  get: (id) => api.get(`/api/vehicles/${id}`),
  create: (data) => api.post('/api/vehicles', data),
  update: (id, data) => api.put(`/api/vehicles/${id}`, data),
  patchStatus: (id, status) => api.patch(`/api/vehicles/${id}/status`, { status }),
  delete: (id) => api.delete(`/api/vehicles/${id}`),
  available: () => api.get('/api/vehicles/available'),
};

export const driversApi = {
  list: (params) => api.get('/api/drivers', { params }),
  get: (id) => api.get(`/api/drivers/${id}`),
  create: (data) => api.post('/api/drivers', data),
  update: (id, data) => api.put(`/api/drivers/${id}`, data),
  patchStatus: (id, status) => api.patch(`/api/drivers/${id}/status`, { status }),
  available: () => api.get('/api/drivers/available'),
  expiringLicenses: (days = 30) =>
    api.get('/api/drivers/expiring-licenses', { params: { days } }),
};

export const tripsApi = {
  list: (params) => api.get('/api/trips', { params }),
  get: (id) => api.get(`/api/trips/${id}`),
  active: () => api.get('/api/trips/active'),
  create: (data) => api.post('/api/trips', data),
  dispatch: (id) => api.post(`/api/trips/${id}/dispatch`),
  complete: (id, data) => api.post(`/api/trips/${id}/complete`, data),
  cancel: (id) => api.post(`/api/trips/${id}/cancel`),
};

export const maintenanceApi = {
  list: (params) => api.get('/api/maintenance', { params }),
  create: (data) => api.post('/api/maintenance', data),
  close: (id) => api.patch(`/api/maintenance/${id}/close`),
};

export const fuelApi = {
  list: (params) => api.get('/api/fuel-logs', { params }),
  create: (data) => api.post('/api/fuel-logs', data),
};

export const expensesApi = {
  list: (params) => api.get('/api/expenses', { params }),
  create: (data) => api.post('/api/expenses', data),
};

export const reportsApi = {
  fuelEfficiency: () => api.get('/api/reports/fuel-efficiency'),
  fleetUtilization: () => api.get('/api/reports/fleet-utilization'),
  operationalCost: () => api.get('/api/reports/operational-cost'),
  vehicleRoi: () => api.get('/api/reports/vehicle-roi'),
  exportCsv: (type) =>
    api.get('/api/reports/export/csv', {
      params: { type },
      responseType: 'blob',
    }),
};

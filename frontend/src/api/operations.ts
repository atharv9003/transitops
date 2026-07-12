import api from './auth';

export async function getMaintenance(params?: Record<string, unknown>) {
  const res = await api.get('/maintenance', { params });
  return res.data;
}

export async function createMaintenance(data: Record<string, unknown>) {
  const res = await api.post('/maintenance', data);
  return res.data;
}

export async function closeMaintenance(id: number) {
  const res = await api.put(`/maintenance/${id}/close`);
  return res.data;
}

export async function getFuelLogs(params?: Record<string, unknown>) {
  const res = await api.get('/fuel', { params });
  return res.data;
}

export async function createFuelLog(data: Record<string, unknown>) {
  const res = await api.post('/fuel', data);
  return res.data;
}

export async function getExpenses(params?: Record<string, unknown>) {
  const res = await api.get('/expenses', { params });
  return res.data;
}

export async function createExpense(data: Record<string, unknown>) {
  const res = await api.post('/expenses', data);
  return res.data;
}

import api from './auth';

export async function getDrivers(params?: { status?: string; search?: string }) {
  const res = await api.get('/drivers', { params });
  return res.data;
}

export async function getAvailableDrivers() {
  const res = await api.get('/drivers/available');
  return res.data;
}

export async function createDriver(data: Record<string, unknown>) {
  const res = await api.post('/drivers', data);
  return res.data;
}

export async function updateDriver(id: number, data: Record<string, unknown>) {
  const res = await api.put(`/drivers/${id}`, data);
  return res.data;
}

export async function deleteDriver(id: number) {
  const res = await api.delete(`/drivers/${id}`);
  return res.data;
}

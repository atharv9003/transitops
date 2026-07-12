import api from './auth';

export async function getTrips(params?: Record<string, string | number | undefined>) {
  const res = await api.get('/trips', { params });
  return res.data;
}

export async function createTrip(data: Record<string, unknown>) {
  const res = await api.post('/trips', data);
  return res.data;
}

export async function dispatchTrip(id: number) {
  const res = await api.put(`/trips/${id}/dispatch`);
  return res.data;
}

export async function completeTrip(id: number, data: Record<string, unknown>) {
  const res = await api.put(`/trips/${id}/complete`, data);
  return res.data;
}

export async function cancelTrip(id: number) {
  const res = await api.put(`/trips/${id}/cancel`);
  return res.data;
}

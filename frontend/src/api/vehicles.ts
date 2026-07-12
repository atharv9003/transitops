import api from './auth';

export async function getVehicles(params?: { type?: string; status?: string; search?: string }) {
  const res = await api.get('/vehicles', { params });
  return res.data;
}

export async function getAvailableVehicles() {
  const res = await api.get('/vehicles/available');
  return res.data;
}

export async function createVehicle(data: Record<string, unknown>) {
  const res = await api.post('/vehicles', data);
  return res.data;
}

export async function updateVehicle(id: number, data: Record<string, unknown>) {
  const res = await api.put(`/vehicles/${id}`, data);
  return res.data;
}

export async function deleteVehicle(id: number) {
  const res = await api.delete(`/vehicles/${id}`);
  return res.data;
}

export async function addVehicleDocument(id: number, doc: { filename: string; url: string; type: string }) {
  const res = await api.post(`/vehicles/${id}/documents`, doc);
  return res.data;
}

import api from './auth';

export async function getAnalyticsReport() {
  const res = await api.get('/analytics/report');
  return res.data;
}

export async function getSettings() {
  const res = await api.get('/settings');
  return res.data;
}

export async function updateSettings(data: Record<string, string>) {
  const res = await api.put('/settings', data);
  return res.data;
}

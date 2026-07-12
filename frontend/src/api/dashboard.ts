import api from './auth';

export async function getDashboardKpis() {
  const res = await api.get('/analytics/dashboard');
  return res.data;
}

export async function getRecentTrips() {
  const res = await api.get('/trips?limit=10');
  return res.data;
}

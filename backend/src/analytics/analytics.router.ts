import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { getDashboardKpis, getAnalyticsReport, toCSV } from './analytics.service';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

// GET /api/analytics/dashboard — KPI cards for dashboard
analyticsRouter.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  try {
    const kpis = await getDashboardKpis();
    res.json(kpis);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/analytics/report — full analytics report
analyticsRouter.get(
  '/report',
  requireRole('Fleet Manager', 'Financial Analyst'),
  async (_req: AuthRequest, res: Response) => {
    try {
      const report = await getAnalyticsReport();
      res.json(report);
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// GET /api/analytics/export/csv — CSV download
analyticsRouter.get(
  '/export/csv',
  requireRole('Fleet Manager', 'Financial Analyst'),
  async (_req: AuthRequest, res: Response) => {
    try {
      const report = await getAnalyticsReport();
      const csv = toCSV(report.vehicleReports as Record<string, unknown>[]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transitops-report.csv"');
      res.send(csv);
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { getAllMaintenance, createMaintenanceRecord, closeMaintenanceRecord } from './maintenance.service';
import { MaintenanceStatus } from '@prisma/client';

export const maintenanceRouter = Router();

maintenanceRouter.use(requireAuth);

// GET /api/maintenance
maintenanceRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, status } = req.query;
    const records = await getAllMaintenance(
      vehicleId ? Number(vehicleId) : undefined,
      status as MaintenanceStatus
    );
    res.json(records);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/maintenance — Fleet Manager only
maintenanceRouter.post(
  '/',
  requireRole('Fleet Manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const record = await createMaintenanceRecord(req.body);
      res.status(201).json(record);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// PUT /api/maintenance/:id/close — Fleet Manager only
maintenanceRouter.put(
  '/:id/close',
  requireRole('Fleet Manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const record = await closeMaintenanceRecord(Number(req.params.id));
      res.json(record);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

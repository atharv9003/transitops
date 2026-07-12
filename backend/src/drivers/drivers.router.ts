import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import {
  getAllDrivers,
  getAvailableDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  checkAndNotifyExpiringLicenses,
} from './drivers.service';
import { DriverStatus } from '@prisma/client';

export const driversRouter = Router();

driversRouter.use(requireAuth);

// GET /api/drivers
driversRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const drivers = await getAllDrivers({
      status: status as DriverStatus,
      search: search as string,
    });
    res.json(drivers);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/drivers/available — for dispatch dropdown
driversRouter.get('/available', async (_req, res: Response) => {
  try {
    const drivers = await getAvailableDrivers();
    res.json(drivers);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/drivers/check-expiry — trigger license expiry email check
driversRouter.get(
  '/check-expiry',
  requireRole('Fleet Manager', 'Safety Officer'),
  async (_req, res: Response) => {
    try {
      const count = await checkAndNotifyExpiringLicenses();
      res.json({ message: `Sent ${count} expiry reminder(s)` });
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// GET /api/drivers/:id
driversRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const driver = await getDriverById(Number(req.params.id));
    res.json(driver);
  } catch (error: unknown) {
    res.status(404).json({ error: (error as Error).message });
  }
});

// POST /api/drivers — Fleet Manager, Safety Officer
driversRouter.post(
  '/',
  requireRole('Fleet Manager', 'Safety Officer'),
  async (req: AuthRequest, res: Response) => {
    try {
      const driver = await createDriver(req.body);
      res.status(201).json(driver);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// PUT /api/drivers/:id
driversRouter.put(
  '/:id',
  requireRole('Fleet Manager', 'Safety Officer'),
  async (req: AuthRequest, res: Response) => {
    try {
      const driver = await updateDriver(Number(req.params.id), req.body);
      res.json(driver);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// DELETE /api/drivers/:id
driversRouter.delete(
  '/:id',
  requireRole('Fleet Manager', 'Safety Officer'),
  async (req: AuthRequest, res: Response) => {
    try {
      await deleteDriver(Number(req.params.id));
      res.json({ message: 'Driver deleted successfully' });
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

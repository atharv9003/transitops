import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { getFuelLogs, createFuelLog, getTotalFuelCostByVehicle } from './fuel.service';

export const fuelRouter = Router();

fuelRouter.use(requireAuth);

// GET /api/fuel
fuelRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, tripId } = req.query;
    const logs = await getFuelLogs(
      vehicleId ? Number(vehicleId) : undefined,
      tripId ? Number(tripId) : undefined
    );
    res.json(logs);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/fuel/total/:vehicleId
fuelRouter.get('/total/:vehicleId', async (req: AuthRequest, res: Response) => {
  try {
    const total = await getTotalFuelCostByVehicle(Number(req.params.vehicleId));
    res.json({ vehicleId: Number(req.params.vehicleId), totalFuelCost: total });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/fuel — Financial Analyst, Fleet Manager
fuelRouter.post(
  '/',
  requireRole('Financial Analyst', 'Fleet Manager', 'Dispatcher'),
  async (req: AuthRequest, res: Response) => {
    try {
      const log = await createFuelLog(req.body);
      res.status(201).json(log);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

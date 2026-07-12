import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import {
  getAllVehicles,
  getAvailableVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  addVehicleDocument,
} from './vehicles.service';
import { VehicleStatus } from '@prisma/client';

export const vehiclesRouter = Router();

// All routes require authentication
vehiclesRouter.use(requireAuth);

// GET /api/vehicles — Fleet Manager, Dispatcher, Financial Analyst can view
vehiclesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, status, search } = req.query;
    const vehicles = await getAllVehicles({
      type: type as string,
      status: status as VehicleStatus,
      search: search as string,
    });
    res.json(vehicles);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/vehicles/available — for dispatch dropdown
vehiclesRouter.get('/available', async (_req: AuthRequest, res: Response) => {
  try {
    const vehicles = await getAvailableVehicles();
    res.json(vehicles);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/vehicles/:id
vehiclesRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await getVehicleById(Number(req.params.id));
    res.json(vehicle);
  } catch (error: unknown) {
    res.status(404).json({ error: (error as Error).message });
  }
});

// POST /api/vehicles — Fleet Manager only
vehiclesRouter.post(
  '/',
  requireRole('Fleet Manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicle = await createVehicle(req.body);
      res.status(201).json(vehicle);
    } catch (error: unknown) {
      const msg = (error as Error).message;
      const isDuplicate = msg.includes('Unique constraint');
      res.status(isDuplicate ? 409 : 400).json({ error: msg });
    }
  }
);

// PUT /api/vehicles/:id — Fleet Manager only
vehiclesRouter.put(
  '/:id',
  requireRole('Fleet Manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicle = await updateVehicle(Number(req.params.id), req.body);
      res.json(vehicle);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// DELETE /api/vehicles/:id — Fleet Manager only
vehiclesRouter.delete(
  '/:id',
  requireRole('Fleet Manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      await deleteVehicle(Number(req.params.id));
      res.json({ message: 'Vehicle deleted successfully' });
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// POST /api/vehicles/:id/documents — Fleet Manager only
vehiclesRouter.post(
  '/:id/documents',
  requireRole('Fleet Manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { filename, url, type } = req.body;
      const vehicle = await addVehicleDocument(Number(req.params.id), { filename, url, type });
      res.json(vehicle);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

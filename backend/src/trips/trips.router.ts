import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { getAllTrips, getTripById, createTrip, dispatchTrip, completeTrip, cancelTrip } from './trips.service';
import { TripStatus } from '@prisma/client';

export const tripsRouter = Router();

tripsRouter.use(requireAuth);

// GET /api/trips
tripsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, vehicleId, driverId, search } = req.query;
    const trips = await getAllTrips({
      status: status as TripStatus,
      vehicleId: vehicleId ? Number(vehicleId) : undefined,
      driverId: driverId ? Number(driverId) : undefined,
      search: search as string,
    });
    res.json(trips);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/trips/:id
tripsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await getTripById(Number(req.params.id));
    res.json(trip);
  } catch (error: unknown) {
    res.status(404).json({ error: (error as Error).message });
  }
});

// POST /api/trips — Dispatcher creates trips
tripsRouter.post(
  '/',
  requireRole('Dispatcher', 'Fleet Manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const trip = await createTrip(req.body);
      res.status(201).json(trip);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// PUT /api/trips/:id/dispatch
tripsRouter.put(
  '/:id/dispatch',
  requireRole('Dispatcher', 'Fleet Manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const trip = await dispatchTrip(Number(req.params.id));
      res.json(trip);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// PUT /api/trips/:id/complete — with cascade (odometer + fuel + expense)
tripsRouter.put(
  '/:id/complete',
  requireRole('Dispatcher', 'Fleet Manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const trip = await completeTrip(Number(req.params.id), req.body);
      res.json(trip);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// PUT /api/trips/:id/cancel
tripsRouter.put(
  '/:id/cancel',
  requireRole('Dispatcher', 'Fleet Manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const trip = await cancelTrip(Number(req.params.id));
      res.json(trip);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

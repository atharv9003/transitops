import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { getSettings, updateSettings } from './settings.service';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

// GET /api/settings
settingsRouter.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/settings — Fleet Manager only
settingsRouter.put(
  '/',
  requireRole('Fleet Manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const settings = await updateSettings(req.body);
      res.json(settings);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

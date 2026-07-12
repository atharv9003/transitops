import { Router, Request, Response } from 'express';
import { loginUser } from './auth.service';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Validation error', message: 'Email and password are required' });
      return;
    }

    const result = await loginUser({ email, password });
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    const isLocked = message.includes('locked');
    res.status(isLocked ? 423 : 401).json({ error: 'Authentication failed', message });
  }
});

// POST /api/auth/logout (stateless — client drops token)
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

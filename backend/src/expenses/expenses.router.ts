import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { getExpenses, createExpense, getTotalOperationalCost } from './expenses.service';

export const expensesRouter = Router();

expensesRouter.use(requireAuth);

// GET /api/expenses
expensesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, tripId } = req.query;
    const expenses = await getExpenses(
      vehicleId ? Number(vehicleId) : undefined,
      tripId ? Number(tripId) : undefined
    );
    res.json(expenses);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/expenses/total/:vehicleId — auto-computes Fuel + Maintenance + Other
expensesRouter.get('/total/:vehicleId', async (req: AuthRequest, res: Response) => {
  try {
    const total = await getTotalOperationalCost(Number(req.params.vehicleId));
    res.json(total);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/expenses
expensesRouter.post(
  '/',
  requireRole('Financial Analyst', 'Fleet Manager', 'Dispatcher'),
  async (req: AuthRequest, res: Response) => {
    try {
      const expense = await createExpense(req.body);
      res.status(201).json(expense);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { authRouter } from './auth/auth.router';
import { vehiclesRouter } from './vehicles/vehicles.router';
import { driversRouter } from './drivers/drivers.router';
import { tripsRouter } from './trips/trips.router';
import { maintenanceRouter } from './maintenance/maintenance.router';
import { fuelRouter } from './fuel/fuel.router';
import { expensesRouter } from './expenses/expenses.router';
import { analyticsRouter } from './analytics/analytics.router';
import { settingsRouter } from './settings/settings.router';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'TransitOps API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/fuel', fuelRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 TransitOps API running on port ${PORT}`);
});

export default app;

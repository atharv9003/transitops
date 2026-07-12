/**
 * Backend unit tests for TransitOps
 * Uses Jest with mocked Prisma and bcrypt — no live DB required.
 */

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

interface MockPrisma {
  user: { findUnique: jest.Mock; update: jest.Mock };
  vehicle: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock };
  driver: { findUnique: jest.Mock; findMany: jest.Mock };
  trip: { count: jest.Mock; create: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock; update: jest.Mock };
  $transaction: jest.Mock;
}

const mockPrismaInstance: MockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  vehicle: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  driver: { findUnique: jest.fn(), findMany: jest.fn() },
  trip: { count: jest.fn(), create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(async (cb: (tx: MockPrisma) => Promise<unknown>) => cb(mockPrismaInstance)),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaInstance),
  VehicleStatus: { Available: 'Available', OnTrip: 'OnTrip', InShop: 'InShop', Retired: 'Retired' },
  DriverStatus: { Available: 'Available', OnTrip: 'OnTrip', OffDuty: 'OffDuty', Suspended: 'Suspended' },
  TripStatus: { Draft: 'Draft', Dispatched: 'Dispatched', Completed: 'Completed', Cancelled: 'Cancelled' },
  MaintenanceStatus: { Active: 'Active', Completed: 'Completed' },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('$hashedpassword'),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
}));

import bcrypt from 'bcryptjs';

// ─── Auth Service Tests ───────────────────────────────────────────────────────
describe('Auth Service — loginUser()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws "Invalid credentials" if user not found', async () => {
    mockPrismaInstance.user.findUnique.mockResolvedValueOnce(null);
    const { loginUser } = await import('../auth/auth.service');
    await expect(loginUser({ email: 'ghost@x.com', password: 'pw' })).rejects.toThrow('Invalid credentials');
  });

  it('throws "Account locked" if user is locked out', async () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 30);
    mockPrismaInstance.user.findUnique.mockResolvedValueOnce({
      id: 1, email: 'a@b.com', passwordHash: 'h', roleId: 1, role: { name: 'Fleet Manager' },
      loginAttempts: 5, lockedUntil: futureDate,
    });
    const { loginUser } = await import('../auth/auth.service');
    await expect(loginUser({ email: 'a@b.com', password: 'pw' })).rejects.toThrow(/Account locked/);
  });

  it('increments loginAttempts on wrong password', async () => {
    mockPrismaInstance.user.findUnique.mockResolvedValueOnce({
      id: 1, email: 'a@b.com', passwordHash: 'h', roleId: 1, role: { name: 'Dispatcher' },
      loginAttempts: 0, lockedUntil: null,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    mockPrismaInstance.user.update.mockResolvedValueOnce({});
    const { loginUser } = await import('../auth/auth.service');
    await expect(loginUser({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(/attempt/);
    expect(mockPrismaInstance.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ loginAttempts: 1 }) })
    );
  });

  it('returns token and user on successful login', async () => {
    mockPrismaInstance.user.findUnique.mockResolvedValueOnce({
      id: 1, email: 'admin@transitops.com', passwordHash: 'hash', roleId: 1, role: { name: 'Fleet Manager' },
      loginAttempts: 0, lockedUntil: null,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    mockPrismaInstance.user.update.mockResolvedValueOnce({});
    const { loginUser } = await import('../auth/auth.service');
    const result = await loginUser({ email: 'admin@transitops.com', password: 'admin123' });
    expect(result.token).toBe('mock.jwt.token');
    expect(result.user.role).toBe('Fleet Manager');
    expect(result.user.email).toBe('admin@transitops.com');
  });

  it('resets loginAttempts to 0 on successful login', async () => {
    mockPrismaInstance.user.findUnique.mockResolvedValueOnce({
      id: 2, email: 'retry@test.com', passwordHash: 'h', roleId: 1, role: { name: 'Dispatcher' },
      loginAttempts: 3, lockedUntil: null,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    mockPrismaInstance.user.update.mockResolvedValueOnce({});
    const { loginUser } = await import('../auth/auth.service');
    await loginUser({ email: 'retry@test.com', password: 'correct' });
    expect(mockPrismaInstance.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ loginAttempts: 0 }) })
    );
  });
});

// ─── Vehicle Utility Tests ────────────────────────────────────────────────────
describe('Vehicle Utilities', () => {
  it('isDispatchable returns true only for Available', async () => {
    const { isDispatchable } = await import('../vehicles/vehicles.utils');
    expect(isDispatchable('Available' as never)).toBe(true);
    expect(isDispatchable('OnTrip' as never)).toBe(false);
    expect(isDispatchable('InShop' as never)).toBe(false);
    expect(isDispatchable('Retired' as never)).toBe(false);
  });

  it('vehicleStatusLabel returns human-readable labels', async () => {
    const { vehicleStatusLabel } = await import('../vehicles/vehicles.utils');
    expect(vehicleStatusLabel('Available' as never)).toBe('Available');
    expect(vehicleStatusLabel('InShop' as never)).toBe('In Shop');
    expect(vehicleStatusLabel('OnTrip' as never)).toBe('On Trip');
    expect(vehicleStatusLabel('Retired' as never)).toBe('Retired');
  });
});

// ─── Trip Service — validation tests ─────────────────────────────────────────
describe('Trip Service — createTrip() validation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws "Vehicle not found" if vehicle does not exist', async () => {
    mockPrismaInstance.vehicle.findUnique.mockResolvedValueOnce(null);
    const { createTrip } = await import('../trips/trips.service');
    await expect(createTrip({
      vehicleId: 999, driverId: 1, source: 'A', destination: 'B',
      cargoWeight: 100, plannedDistance: 100,
    })).rejects.toThrow('Vehicle not found');
  });

  it('throws if vehicle is not Available', async () => {
    mockPrismaInstance.vehicle.findUnique.mockResolvedValueOnce({ id: 1, status: 'InShop', maxCapacity: 1000 });
    const { createTrip } = await import('../trips/trips.service');
    await expect(createTrip({
      vehicleId: 1, driverId: 1, source: 'A', destination: 'B',
      cargoWeight: 100, plannedDistance: 100,
    })).rejects.toThrow(/not available/);
  });

  it('throws if cargo weight exceeds vehicle capacity', async () => {
    mockPrismaInstance.vehicle.findUnique.mockResolvedValueOnce({ id: 1, status: 'Available', maxCapacity: 500 });
    const { createTrip } = await import('../trips/trips.service');
    await expect(createTrip({
      vehicleId: 1, driverId: 1, source: 'A', destination: 'B',
      cargoWeight: 9999, plannedDistance: 100,
    })).rejects.toThrow(/Cargo weight/);
  });

  it('throws if driver not found', async () => {
    mockPrismaInstance.vehicle.findUnique.mockResolvedValueOnce({ id: 1, status: 'Available', maxCapacity: 1000 });
    mockPrismaInstance.driver.findUnique.mockResolvedValueOnce(null);
    const { createTrip } = await import('../trips/trips.service');
    await expect(createTrip({
      vehicleId: 1, driverId: 9, source: 'A', destination: 'B',
      cargoWeight: 100, plannedDistance: 100,
    })).rejects.toThrow('Driver not found');
  });

  it('throws if driver license has expired', async () => {
    mockPrismaInstance.vehicle.findUnique.mockResolvedValueOnce({ id: 1, status: 'Available', maxCapacity: 1000 });
    mockPrismaInstance.driver.findUnique.mockResolvedValueOnce({
      id: 1, status: 'Available', licenseExpiry: new Date('2020-01-01'),
    });
    const { createTrip } = await import('../trips/trips.service');
    await expect(createTrip({
      vehicleId: 1, driverId: 1, source: 'A', destination: 'B',
      cargoWeight: 100, plannedDistance: 100,
    })).rejects.toThrow(/license has expired/);
  });
});

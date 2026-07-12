/**
 * Frontend unit tests for TransitOps
 * Uses Vitest + React Testing Library + jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── vi.mock calls must be at top level (they are hoisted by Vitest) ──────────

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../api/vehicles', () => ({
  getVehicles: vi.fn().mockResolvedValue([]),
  getAvailableVehicles: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/drivers', () => ({
  getDrivers: vi.fn().mockResolvedValue([]),
  getAvailableDrivers: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/trips', () => ({
  getTrips: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/analytics', () => ({
  getAnalyticsReport: vi.fn().mockResolvedValue({
    kpis: { fleetUtilization: 75, totalVehicles: 5, activeTrips: 2 },
    avgFuelEfficiency: 8.5,
    totalOperationalCost: 25000,
    monthlyRevenue: [],
    topCostliestVehicles: [],
    vehicleReports: [],
  }),
}));

vi.mock('../api/auth', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        fleetUtilization: 75, totalVehicles: 5, activeTrips: 2,
        availableVehicles: 3, vehiclesInShop: 1, driversOnDuty: 3,
        maintenancePending: 2, revenueThisMonth: 150000,
      },
    }),
    post: vi.fn(),
  },
}));

// Import the mocked store so we can configure it per-test
import { useAuthStore } from '../store/authStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockFleetManager() {
  vi.mocked(useAuthStore).mockImplementation(((selector: (s: unknown) => unknown) => {
    const state = {
      token: 'tok', user: { id: 1, email: 'admin@t.com' }, role: 'Fleet Manager',
      login: vi.fn(), logout: vi.fn(),
    };
    return typeof selector === 'function' ? selector(state) : state;
  }) as never);
}

function mockDispatcher() {
  vi.mocked(useAuthStore).mockImplementation(((selector: (s: unknown) => unknown) => {
    const state = {
      token: 'tok', user: { id: 2, email: 'disp@t.com' }, role: 'Dispatcher',
      login: vi.fn(), logout: vi.fn(),
    };
    return typeof selector === 'function' ? selector(state) : state;
  }) as never);
}

function mockNoAuth() {
  vi.mocked(useAuthStore).mockImplementation(((selector: (s: unknown) => unknown) => {
    const state = { token: null, user: null, role: null, login: vi.fn(), logout: vi.fn() };
    return typeof selector === 'function' ? selector(state) : state;
  }) as never);
}

// ─── LoginPage Tests ──────────────────────────────────────────────────────────
describe('LoginPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mockNoAuth(); });

  it('renders email and password inputs', async () => {
    const { LoginPage } = await import('../pages/LoginPage');
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    // Email input has placeholder 'admin@transitops.com'
    expect(screen.getByPlaceholderText('admin@transitops.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('renders the TransitOps branding text', async () => {
    const { LoginPage } = await import('../pages/LoginPage');
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    // Multiple elements contain 'TransitOps'; getAllByText returns them all
    const branding = screen.getAllByText(/TransitOps/i);
    expect(branding.length).toBeGreaterThan(0);
  });

  it('renders a Sign In submit button', async () => {
    const { LoginPage } = await import('../pages/LoginPage');
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});

// ─── FleetPage Tests ──────────────────────────────────────────────────────────
describe('FleetPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders "Fleet Registry" heading', async () => {
    mockFleetManager();
    const { FleetPage } = await import('../pages/FleetPage');
    render(<MemoryRouter><FleetPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Fleet Registry')).toBeInTheDocument();
    });
  });

  it('shows "Add Vehicle" button for Fleet Manager', async () => {
    mockFleetManager();
    const { FleetPage } = await import('../pages/FleetPage');
    render(<MemoryRouter><FleetPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('+ Add Vehicle')).toBeInTheDocument();
    });
  });

  it('does not show "Add Vehicle" for read-only roles', async () => {
    vi.mocked(useAuthStore).mockImplementation(((selector: (s: unknown) => unknown) => {
      const state = { token: 'tok', role: 'Safety Officer', login: vi.fn(), logout: vi.fn() };
      return typeof selector === 'function' ? selector(state) : state;
    }) as never);
    const { FleetPage } = await import('../pages/FleetPage');
    render(<MemoryRouter><FleetPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.queryByText('+ Add Vehicle')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no vehicles', async () => {
    mockFleetManager();
    const { FleetPage } = await import('../pages/FleetPage');
    render(<MemoryRouter><FleetPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/no vehicles found/i)).toBeInTheDocument();
    });
  });
});

// ─── DriversPage Tests ───────────────────────────────────────────────────────
describe('DriversPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders "Driver Registry" heading', async () => {
    mockFleetManager();
    const { DriversPage } = await import('../pages/DriversPage');
    render(<MemoryRouter><DriversPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Driver Registry')).toBeInTheDocument();
    });
  });

  it('shows "Add Driver" button for Fleet Manager', async () => {
    mockFleetManager();
    const { DriversPage } = await import('../pages/DriversPage');
    render(<MemoryRouter><DriversPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('+ Add Driver')).toBeInTheDocument();
    });
  });

  it('shows empty state when no drivers', async () => {
    mockFleetManager();
    const { DriversPage } = await import('../pages/DriversPage');
    render(<MemoryRouter><DriversPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/no drivers found/i)).toBeInTheDocument();
    });
  });
});

// ─── TripsPage Tests ──────────────────────────────────────────────────────────
describe('TripsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders "Trip Management" heading', async () => {
    mockDispatcher();
    const { TripsPage } = await import('../pages/TripsPage');
    render(<MemoryRouter><TripsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Trip Management')).toBeInTheDocument();
    });
  });

  it('shows "Create Trip" button for Dispatcher', async () => {
    mockDispatcher();
    const { TripsPage } = await import('../pages/TripsPage');
    render(<MemoryRouter><TripsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('+ Create Trip')).toBeInTheDocument();
    });
  });

  it('shows status filter dropdown', async () => {
    mockDispatcher();
    const { TripsPage } = await import('../pages/TripsPage');
    render(<MemoryRouter><TripsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('All Statuses')).toBeInTheDocument();
    });
  });
});

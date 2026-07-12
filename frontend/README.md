# TransitOps — Frontend

React + Vite + TypeScript frontend for the TransitOps Smart Transport Operations Platform.

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| TransitOps Backend | running on port 3001 |

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

The default `.env` works out of the box for local development:

```env
VITE_API_URL=http://localhost:3001/api
```

### 3. Start the Dev Server

```bash
npm run dev
```

App runs at **http://localhost:5173**

> ⚠️ Make sure the backend is running first (`cd backend && npm run dev`)

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | `admin@transitops.com` | `admin123` |
| Fleet Manager | `manager2@transitops.com` | `password123` |
| Dispatcher | `dispatcher@transitops.com` | `password123` |
| Dispatcher | `dispatcher2@transitops.com` | `password123` |
| Safety Officer | `safety@transitops.com` | `password123` |
| Safety Officer | `safety2@transitops.com` | `password123` |
| Financial Analyst | `finance@transitops.com` | `password123` |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Language | TypeScript 5 |
| Styling | Vanilla CSS (custom dark design system) |
| State Management | Zustand |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Testing | Vitest + React Testing Library |

---

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── api/                # Axios API client modules
│   │   ├── auth.ts         # Login, token refresh
│   │   ├── vehicles.ts     # Vehicle CRUD
│   │   ├── drivers.ts      # Driver CRUD
│   │   ├── trips.ts        # Trip dispatch pipeline
│   │   ├── maintenance.ts  # Maintenance log
│   │   ├── fuelExpense.ts  # Fuel & expense tracking
│   │   ├── analytics.ts    # KPI & report data
│   │   └── settings.ts     # Depot settings
│   ├── components/
│   │   └── layout/
│   │       └── Sidebar.tsx # Navigation sidebar with role-based links
│   ├── pages/              # Route-level page components
│   │   ├── LoginPage.tsx   # Auth page with role info panel
│   │   ├── DashboardPage.tsx  # KPI cards + recent trips + status chart
│   │   ├── FleetPage.tsx   # Vehicle registry with status filter
│   │   ├── DriversPage.tsx # Driver list with license expiry alerts
│   │   ├── TripsPage.tsx   # Trip dispatch pipeline
│   │   ├── MaintenancePage.tsx  # Maintenance log
│   │   ├── FuelExpensePage.tsx  # Fuel & expense tracking
│   │   ├── ReportsPage.tsx # Analytics charts + CSV export
│   │   └── SettingsPage.tsx # Depot configuration
│   ├── router/
│   │   └── index.tsx       # Protected routes + AppShell layout
│   ├── store/
│   │   └── authStore.ts    # Zustand auth store (token + user)
│   ├── App.tsx             # BrowserRouter root
│   ├── main.tsx            # React DOM entry
│   └── index.css           # Global CSS design system
├── .env                    # Local env vars — NOT committed
├── .env.example            # Template — commit-safe
├── eslint.config.js        # ESLint 9 flat config
├── vite.config.ts          # Vite config (proxy, env prefix, vitest)
└── tsconfig.json
```

---

## 🎨 Design System

TransitOps uses a **dark-mode-first** CSS design system defined in `src/index.css`:

| Token | Description |
|-------|-------------|
| `--color-bg` | Page background (`#0b0d14`) |
| `--color-surface` | Card/panel surface (`#141720`) |
| `--color-accent` | Primary accent (`#6366f1` indigo) |
| `--color-success` | Available/OK (`#22c55e`) |
| `--color-warning` | Caution (`#f59e0b`) |
| `--color-danger` | Error/blocked (`#ef4444`) |

CSS classes: `btn`, `btn-primary`, `btn-danger`, `card`, `badge`, `form-input`, `form-label`, `data-table`.

---

## 🔐 Role-Based UI

The sidebar and page controls adapt based on the logged-in user's role:

| Feature | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|---------|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Fleet Management | ✅ | 👁️ | 👁️ | ❌ |
| Driver Management | ✅ | 👁️ | ✅ | ❌ |
| Trip Dispatch | ✅ | ✅ | ❌ | ❌ |
| Maintenance | ✅ | 👁️ | ✅ | 👁️ |
| Fuel & Expenses | ✅ | ❌ | ❌ | ✅ |
| Analytics | ✅ | ❌ | ❌ | ✅ |
| Settings | ✅ | ❌ | ❌ | ❌ |

✅ Full access &nbsp;|&nbsp; 👁️ Read-only &nbsp;|&nbsp; ❌ Hidden

---

## 🌐 Pages Overview

### Dashboard
Real-time KPI cards (Fleet Utilization, Active Trips, Total Revenue, Drivers Available) plus a recent trips table and vehicle status donut chart.

### Fleet
Vehicle registry with status filters (Available / InShop / Retired / OnTrip), search, and add/edit modal. Fleet Managers can add and edit vehicles.

### Drivers
Driver registry with license expiry alerts — licenses expiring within 30 days show amber warnings; expired licenses show red alerts.

### Trips
Full dispatch pipeline: Create → Draft → Dispatch → Complete/Cancel. Cargo weight is validated against vehicle capacity.

### Maintenance
Log maintenance records (Oil Change, Brake, Tyre, Engine, etc.). Opening a record automatically sets the vehicle to `InShop`.

### Fuel & Expenses
Tabbed view: Fuel logs (litres + cost per trip) and Expense tracking (toll + miscellaneous). Summary KPI cards at the top.

### Analytics
Revenue charts (monthly bar chart), Fleet ROI table (revenue vs. cost per vehicle), and CSV export.

### Settings
Depot name, currency, and distance unit configuration.

---

## 🧪 Running Tests

```bash
npm test
```

**13 tests** covering:

| Suite | Tests |
|-------|-------|
| LoginPage — renders branding, inputs, submit button | 3 |
| FleetPage — renders heading, add button, role guard | 4 |
| DriversPage — renders list heading, columns | 3 |
| TripsPage — renders heading, status filter | 3 |

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (HMR) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit tests |
| `npm run preview` | Preview production build locally |

---

## 🐳 Docker / Production

For production deployment the frontend is served by Nginx (see `Dockerfile` and `nginx.conf`).

```bash
# From project root
docker-compose up --build
```

Frontend served at **http://localhost:80**

# TransitOps — Backend API

Node.js + Express + TypeScript REST API for the TransitOps Smart Transport Operations Platform.

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 18.x |
| MySQL | ≥ 8.0 |
| npm | ≥ 9.x |

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DATABASE_URL="mysql://root:your_password@localhost:3306/transitops"
JWT_SECRET=your-secret-key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx   # Get from https://resend.com
```

### 3. Set Up Database

```bash
# Run migrations
npx prisma migrate dev --name initial

# Seed sample data (users, vehicles, drivers, 3 months of trips)
npx ts-node prisma/seed.ts
```

### 4. Start Development Server

```bash
npm run dev
```

API runs at **http://localhost:3001**

---

## 🔑 Default Credentials (after seeding)

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
| Runtime | Node.js 18 |
| Framework | Express 4 |
| Language | TypeScript 5 |
| ORM | Prisma 5 (MySQL) |
| Auth | JWT + bcryptjs |
| Email | Resend API (SMTP fallback) |
| Validation | Express middleware |

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema — all models & enums
│   ├── seed.ts             # Sample data seeder
│   └── migrations/         # Prisma migration history
├── src/
│   ├── index.ts            # App entry — Express setup & middleware
│   ├── auth/               # JWT login, RBAC middleware, lockout
│   ├── vehicles/           # Vehicle CRUD + status enforcement
│   ├── drivers/            # Driver CRUD + license expiry checks
│   ├── trips/              # Trip lifecycle (Draft→Dispatched→Completed)
│   ├── maintenance/        # Maintenance log management
│   ├── fuel-expense/       # Fuel logs and expense tracking
│   ├── analytics/          # KPI aggregation and reporting
│   ├── settings/           # Depot configuration
│   └── notifications/      # Resend email service (SMTP fallback)
├── .env                    # Local secrets — NOT committed
├── .env.example            # Template — commit-safe, no real credentials
└── package.json
```

---

## 🔐 Authentication & Roles

All routes (except `/api/auth/login`) require a `Bearer <token>` header.

| Role | Permissions |
|------|------------|
| **Fleet Manager** | Full access — vehicles, drivers, trips, analytics, settings |
| **Dispatcher** | Create and manage trips, view vehicles and drivers |
| **Safety Officer** | View drivers, maintenance logs, safety scores |
| **Financial Analyst** | View expenses, fuel logs, revenue analytics |

Account lockout: **5 failed login attempts** locks the account for **15 minutes**.

---

## 🌐 API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login — returns JWT token |
| GET  | `/api/auth/me` | Get current user profile |

### Vehicles
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/vehicles` | List all vehicles (filterable) |
| POST | `/api/vehicles` | Add vehicle |
| PUT  | `/api/vehicles/:id` | Update vehicle |
| DELETE | `/api/vehicles/:id` | Delete vehicle |

### Drivers
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/drivers` | List all drivers |
| POST | `/api/drivers` | Add driver |
| PUT  | `/api/drivers/:id` | Update driver |

### Trips
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/trips` | List trips (filter by status/vehicle/driver) |
| POST | `/api/trips` | Create trip (Draft status) |
| POST | `/api/trips/:id/dispatch` | Dispatch trip → OnTrip |
| POST | `/api/trips/:id/complete` | Complete trip → restores vehicle/driver |
| POST | `/api/trips/:id/cancel` | Cancel trip |

### Analytics
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analytics/kpis` | Fleet utilization, revenue totals |
| GET | `/api/analytics/fleet-report` | Per-vehicle revenue, distance, fuel cost |
| GET | `/api/analytics/monthly-revenue` | Last 6 months revenue chart data |
| GET | `/api/analytics/export` | CSV export |

---

## ⚙️ Business Rules

- **Dispatch blocked** if vehicle is not `Available` or driver's license is expired
- **Cargo weight** must not exceed vehicle `maxCapacity`
- **Completing a trip** atomically restores vehicle + driver to `Available`, creates fuel log and expense records
- **License expiry reminders** are sent via Resend when a driver's license expires within 30 days

---

## 🧪 Running Tests

```bash
npm test
```

**18 tests** across 2 suites:
- `backend.test.ts` — auth lockout, vehicle dispatch rules, trip validation (12 tests)
- `email.test.ts` — Resend primary, SMTP fallback, no-transport path (6 tests)

---

## 🐳 Docker

```bash
# Build and run all services (MySQL + Backend + Frontend)
docker-compose up --build
```

See `../docker-compose.yml` for full configuration.

---

## 📧 Email Configuration

TransitOps uses **Resend** as the primary email provider with **SMTP as fallback**.

| Purpose | From Address |
|---------|-------------|
| License reminders | `reminders.transitops@felix-au.me` |
| General notifications | `contact.transitops@felix-au.me` |

Set `RESEND_API_KEY` in `.env`. If unset, falls back to SMTP. If neither is configured, emails are logged to console only.

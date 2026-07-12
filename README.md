# TransitOps Smart

**Smart Transport Operations Platform** — an end-to-end platform that digitizes vehicle, driver, dispatch, maintenance, and expense management while enforcing business rules and providing operational insights.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | MySQL |
| Frontend | Vite + React + TypeScript + Vanilla CSS |
| Auth | JWT + RBAC |
| Charts | Recharts |
| State | Zustand |
| Dev Env | Docker Compose |

---

## Contributors

| Contributor | Role | Scope |
|---|---|---|
| Felix-au | Backend Engineer | API, Database, Auth, Business Logic, Infra |
| Atharv Jain | Frontend Engineer | React UI, Design System, Charts |

---

## Modules

- **Authentication** — JWT login with RBAC (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst)
- **Dashboard** — KPI overview: active vehicles, trips, drivers on duty, fleet utilization
- **Fleet (Vehicle Registry)** — Vehicle lifecycle with status tracking and document management
- **Driver Management** — Driver profiles with license expiry alerts
- **Trip Dispatcher** — Full trip lifecycle with real-time capacity validation and completion cascade
- **Maintenance** — Service log with automatic vehicle status transitions
- **Fuel & Expenses** — Fuel logs and operational expense tracking with auto-totals
- **Reports & Analytics** — Fleet utilization, fuel efficiency, operational cost, ROI charts + CSV/PDF export
- **Settings** — Depot configuration and RBAC permission matrix

---

## Local Setup

### Prerequisites
- Node.js 18+
- MySQL running locally (`root` / `Admin@123`)
- Docker (optional, for Compose setup)

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker Compose (full stack)

```bash
docker-compose up --build
```

---

## Environment Variables (`backend/.env`)

```env
DATABASE_URL="mysql://root:Admin%40123@localhost:3306/transitops"
JWT_SECRET="your-secret-key"
PORT=3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=yourpassword
```

---

*TransitOps © 2026*

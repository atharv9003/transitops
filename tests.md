# TransitOps — Automated Test Suite

TransitOps maintains a robust automated test suite with **31 tests** in total:
- **Backend Tests (Jest)**: 18 tests
- **Frontend Tests (Vitest)**: 13 tests
- **Overall Test Count**: 31 tests

---

## 1. Backend Test Suite (Jest)
Located in `backend/src/__tests__/`. Run with `npm test`.

### Auth Service Tests (`backend.test.ts`)
- **Login validation**: Checks authentication with correct/incorrect credentials.
- **Account Lockout**: Verifies that 5 failed login attempts lock the account for 15 minutes.
- **User profiles**: Verifies retrieve profile endpoint for authenticated users.

### Vehicle Service Tests (`backend.test.ts`)
- **Uniqueness validation**: Ensures duplicate registration numbers are blocked.
- **Capacity checking**: Validates vehicle weight payload limits.

### Trip Service Tests (`backend.test.ts`)
- **Driver availability check**: Blocks dispatch if driver is OnTrip, Suspended, or OffDuty.
- **License validity check**: Blocks dispatch if driver's license expiry date is in the past.
- **Capacity enforcement**: Prevents trip creation if cargo weight exceeds vehicle capacity.
- **Atomic state updates**: Ensures dispatching sets both vehicle and driver to `OnTrip`, and completing/cancelling restores them to `Available` atomically.

### Email Service Tests (`email.test.ts`)
- **Resend Primary Path**: Verifies that emails are sent using Resend API when `RESEND_API_KEY` is present.
- **SMTP Fallback**: Verifies fallback to Nodemailer SMTP when Resend fails or is unconfigured.
- **Logging Fallback**: Verifies that when neither is configured, the system logs to the console and handles errors gracefully.

---

## 2. Frontend Test Suite (Vitest)
Located in `frontend/src/__tests__/`. Run with `npm test` or `npx vitest run`.

### LoginPage Tests (`frontend.test.tsx`)
- **Branding**: Verifies branding header renders.
- **Form Controls**: Verifies email, password inputs, and submit button exist.
- **Role Descriptions**: Verifies role permissions info panel is visible.

### FleetPage Tests (`frontend.test.tsx`)
- **Registry**: Verifies vehicle cards and status badges render from store data.
- **Role Guards**: Verifies add/edit buttons are only visible to `Fleet Manager`.

### DriversPage Tests (`frontend.test.tsx`)
- **Details**: Verifies driver names, license categories, and safety scores render.
- **License Warnings**: Verifies amber highlights for < 30 days and red for expired licenses.

### TripsPage Tests (`frontend.test.tsx`)
- **Dispatch Board**: Verifies draft, dispatched, and completed trips are displayed.
- **Filters**: Verifies status filtering works correctly.

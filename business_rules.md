# Logistics Business Rules

TransitOps strictly enforces a set of mandatory logistics business rules at both the API level and the database constraints to prevent scheduling conflicts, overload hazards, and compliance violations.

---

## 1. Asset Constraints

### Vehicle Uniqueness
- The vehicle registration number (e.g. `VAN-05`, `TRK-12`) is unique. Adding a duplicate registration number is blocked at the database layer.

### Selection Exclusions
- **Retired** or **In Shop** (under maintenance) vehicles must never appear in the dispatch selection lists.
- **On Trip** vehicles are excluded from trip creation pool to prevent double-booking.

---

## 2. Compliance Constraints

### Driver Compliance
- **Suspended** or **Off Duty** drivers are excluded from selection lists.
- **Expired Licenses**: Drivers with an expired license date (`licenseExpiry` < current date) cannot be assigned to trips.
- **Visual Alerting**:
  - Expiry date ≤ 30 days is highlighted in Amber in the UI.
  - Expiry date ≤ 0 days is highlighted in Red in the UI.

---

## 3. Dispatch & Load Constraints

### Weight Limit Enforcement
- A trip's **Cargo Weight** (kg) must not exceed the selected vehicle's **Maximum Load Capacity** (`maxCapacity` in kg). The API throws a validation error and blocks creation if this rule is violated.

### Atomic Dispatch Transitions
- Dispatching a trip (transitioning Draft → Dispatched) updates both the vehicle and driver status to **`OnTrip`** atomically inside a database transaction.

---

## 4. Lifecycle Transitions

### Trip Completion Cascade
- Completing a trip (Dispatched → Completed) requires final odometer reading, fuel consumed (liters), fuel cost, toll cost, and other expenses.
- This transition executes in a transaction that:
  1. Sets the vehicle and driver status back to **`Available`**.
  2. Updates the vehicle odometer.
  3. Records a **`FuelLog`** entry linked to the vehicle and trip.
  4. Records an **`Expense`** entry (tolls + misc) linked to the vehicle and trip.
  5. Transitions the trip status to `Completed`.

### Trip Cancellation
- Cancelling a dispatched trip restores both the vehicle and driver status to **`Available`** atomically. Draft trips can be cancelled without affecting status.

---

## 5. Maintenance Transitions

### Maintenance Log Cascade
- Opening a maintenance record (e.g. "Oil Change") automatically changes the vehicle status to **`InShop`**, which hides it from the dispatcher's selection pool.
- Closing/completing the maintenance record restores the vehicle status to **`Available`** (unless it has been set to `Retired`).

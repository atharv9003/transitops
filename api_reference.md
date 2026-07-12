# REST API Endpoints Reference

The backend runs on port `3001` and serves the REST API routes prefixed with `/api`. All routes except `/api/auth/login` require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication

### Post Login
- **Route**: `POST /api/auth/login`
- **Body**: `{ "email": "admin@transitops.com", "password": "admin123" }`
- **Response**: `{ "token": "jwt...", "user": { "email": "...", "role": "Fleet Manager" } }`

---

## 2. Vehicle Registry

### Get Vehicles
- **Route**: `GET /api/vehicles`
- **Query Params (Optional)**: `status`, `type`
- **Response**: List of all vehicles.

### Add Vehicle (Manager Only)
- **Route**: `POST /api/vehicles`
- **Body**: `{ "regNumber": "VAN-99", "name": "Tata Ace", "type": "Van", "maxCapacity": 500, "acquisitionCost": 800000, "odometer": 1200 }`

---

## 3. Driver Registry

### Get Drivers
- **Route**: `GET /api/drivers`
- **Response**: List of driver objects.

### Add Driver (Manager / Safety Only)
- **Route**: `POST /api/drivers`
- **Body**: `{ "name": "Alex Sharma", "licenseNumber": "DL-...", "licenseCategory": "B", "licenseExpiry": "2027-03-15", "contactNumber": "+91 ...", "safetyScore": 92 }`

---

## 4. Trips Dispatch Pipeline

### Get Trips
- **Route**: `GET /api/trips`
- **Query Params**: `status`, `vehicleId`, `driverId`, `search` (searches source, destination, tripCode)

### Create Trip (Dispatcher / Manager Only)
- **Route**: `POST /api/trips`
- **Body**: `{ "source": "A", "destination": "B", "vehicleId": 1, "driverId": 2, "cargoWeight": 300, "cargoDescription": "Apples", "plannedDistance": 100, "revenueAmount": 15000 }`
- **Response**: Created trip object.

### Dispatch Trip (Dispatcher / Manager Only)
- **Route**: `POST /api/trips/:id/dispatch`
- **Response**: Updated trip with `Dispatched` status.

### Complete Trip (Dispatcher / Manager Only)
- **Route**: `POST /api/trips/:id/complete`
- **Body**: `{ "finalOdometer": 15200, "fuelLiters": 35, "fuelCost": 3300, "toll": 250, "otherExpense": 120 }`
- **Response**: Completed trip with related fuel logs and expense records created.

---

## 5. Maintenance Log

### Get Logs
- **Route**: `GET /api/maintenance`

### Create Log (Manager / Safety Only)
- **Route**: `POST /api/maintenance`
- **Body**: `{ "vehicleId": 1, "serviceType": "Oil Change", "description": "10k km service", "cost": 4500, "date": "2026-07-12" }`
- **Response**: Created record. Vehicle becomes `InShop`.

---

## 6. Analytics

### Get KPIs
- **Route**: `GET /api/analytics/kpis`
- **Response**: `{ "activeVehicles": 5, "availableVehicles": 8, "vehiclesInMaintenance": 2, "activeTrips": 3, "pendingTrips": 1, "driversOnDuty": 3, "fleetUtilization": 37.5 }`

### Get Reports (Manager / Finance Only)
- **Route**: `GET /api/analytics/report`
- **Response**: Chart revenue array, vehicle ROI data array, average fuel efficiency.

### Export CSV (Manager / Finance Only)
- **Route**: `GET /api/analytics/export`
- **Response**: CSV stream download.

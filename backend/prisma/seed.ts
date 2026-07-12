/**
 * TransitOps — Database Seed
 *
 * Run: npx ts-node prisma/seed.ts
 *
 * Seeds: Roles, Users, Depot, Vehicles, Drivers,
 *        Completed Trips (3 months back), Fuel Logs, Expenses, Maintenance records
 */

import { PrismaClient, DriverStatus, VehicleStatus, TripStatus, MaintenanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Roles ───────────────────────────────────────────────────────────────────
  const roleNames = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];
  const roles = await Promise.all(
    roleNames.map(name =>
      prisma.role.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  console.log(`✅ Seeded ${roles.length} roles`);

  const roleMap = Object.fromEntries(roles.map(r => [r.name, r]));

  // ─── Users ───────────────────────────────────────────────────────────────────
  const users = [
    { email: 'admin@transitops.com',      password: 'admin123',    role: 'Fleet Manager'     },
    { email: 'dispatcher@transitops.com', password: 'password123', role: 'Dispatcher'        },
    { email: 'dispatcher2@transitops.com',password: 'password123', role: 'Dispatcher'        },
    { email: 'safety@transitops.com',     password: 'password123', role: 'Safety Officer'    },
    { email: 'safety2@transitops.com',    password: 'password123', role: 'Safety Officer'    },
    { email: 'finance@transitops.com',    password: 'password123', role: 'Financial Analyst' },
    { email: 'manager2@transitops.com',   password: 'password123', role: 'Fleet Manager'     },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { email: u.email, passwordHash: hash, roleId: roleMap[u.role].id },
    });
  }
  console.log(`✅ Seeded ${users.length} users`);

  // ─── Depot Settings ──────────────────────────────────────────────────────────
  const existing = await prisma.depotSettings.findFirst();
  if (!existing) {
    await prisma.depotSettings.create({
      data: { depotName: 'Gandhinagar Central Depot GJ4', currency: 'INR (Rs)', distanceUnit: 'Kilometers' },
    });
    console.log('✅ Seeded depot settings');
  }

  // ─── Vehicles ────────────────────────────────────────────────────────────────
  const vehicleData = [
    { regNumber: 'VAN-05',   name: 'Tata Ace Gold',        type: 'Van',   maxCapacity: 500,  acquisitionCost: 850000,  odometer: 12400, status: VehicleStatus.Available },
    { regNumber: 'TRK-12',   name: 'Ashok Leyland Dost',   type: 'Truck', maxCapacity: 2000, acquisitionCost: 1500000, odometer: 45200, status: VehicleStatus.Available },
    { regNumber: 'MINI-08',  name: 'Mahindra Supro',        type: 'Mini',  maxCapacity: 800,  acquisitionCost: 620000,  odometer: 8700,  status: VehicleStatus.Available },
    { regNumber: 'TRUCK-11', name: 'TATA LPT 2518',         type: 'Truck', maxCapacity: 5000, acquisitionCost: 2800000, odometer: 89000, status: VehicleStatus.InShop   },
    { regNumber: 'MINI-03',  name: 'Piaggio Ape',           type: 'Mini',  maxCapacity: 400,  acquisitionCost: 380000,  odometer: 23400, status: VehicleStatus.Retired  },
    { regNumber: 'TRK-07',   name: 'Eicher Pro 2095',       type: 'Truck', maxCapacity: 3500, acquisitionCost: 2200000, odometer: 62000, status: VehicleStatus.Available },
    { regNumber: 'VAN-14',   name: 'Mahindra Bolero Pik-Up',type: 'Van',   maxCapacity: 750,  acquisitionCost: 920000,  odometer: 18900, status: VehicleStatus.Available },
    { regNumber: 'TRK-19',   name: 'Bharatbenz 1617R',      type: 'Truck', maxCapacity: 8000, acquisitionCost: 3500000, odometer: 31000, status: VehicleStatus.Available },
  ];

  for (const v of vehicleData) {
    await prisma.vehicle.upsert({ where: { regNumber: v.regNumber }, update: {}, create: v });
  }

  const vehicles = await prisma.vehicle.findMany({ where: { status: VehicleStatus.Available } });
  console.log(`✅ Seeded ${vehicleData.length} vehicles`);

  // ─── Drivers ─────────────────────────────────────────────────────────────────
  const driverData = [
    { name: 'Alex Sharma',    licenseNumber: 'DL-2020-001234', licenseCategory: 'B', licenseExpiry: new Date('2027-03-15'), contactNumber: '+91 9876543210', safetyScore: 92, status: DriverStatus.Available },
    { name: 'John Patel',     licenseNumber: 'GJ-2019-005678', licenseCategory: 'C', licenseExpiry: new Date('2026-09-30'), contactNumber: '+91 9845612300', safetyScore: 88, status: DriverStatus.Available },
    { name: 'Priya Mehta',    licenseNumber: 'MH-2021-009012', licenseCategory: 'B', licenseExpiry: new Date('2028-01-20'), contactNumber: '+91 9712345678', safetyScore: 95, status: DriverStatus.Available },
    { name: 'Suresh Kumar',   licenseNumber: 'KA-2018-003456', licenseCategory: 'D', licenseExpiry: new Date('2025-06-01'), contactNumber: '+91 9632145870', safetyScore: 74, status: DriverStatus.Available }, // Expired
    { name: 'Raven Kapoor',   licenseNumber: 'GJ-2022-007890', licenseCategory: 'B', licenseExpiry: new Date('2029-11-10'), contactNumber: '+91 9988776655', safetyScore: 98, status: DriverStatus.Available },
    { name: 'Devika Nair',    licenseNumber: 'KL-2021-004321', licenseCategory: 'C', licenseExpiry: new Date('2027-08-25'), contactNumber: '+91 9776543210', safetyScore: 91, status: DriverStatus.Available },
    { name: 'Arjun Singh',    licenseNumber: 'PB-2020-009876', licenseCategory: 'D', licenseExpiry: new Date('2026-12-01'), contactNumber: '+91 9654321098', safetyScore: 85, status: DriverStatus.Available },
    { name: 'Kavya Reddy',    licenseNumber: 'TS-2023-002345', licenseCategory: 'B', licenseExpiry: new Date('2030-03-18'), contactNumber: '+91 9543216789', safetyScore: 97, status: DriverStatus.Available },
  ];

  for (const d of driverData) {
    await prisma.driver.upsert({ where: { licenseNumber: d.licenseNumber }, update: {}, create: d });
  }

  const drivers = await prisma.driver.findMany({ where: { status: DriverStatus.Available, licenseExpiry: { gt: new Date() } } });
  console.log(`✅ Seeded ${driverData.length} drivers`);

  // ─── Trips + Fuel Logs + Expenses (Historical — 3 months) ────────────────────
  // Skip seeding if trips already exist
  const tripCount = await prisma.trip.count();
  if (tripCount > 0) {
    console.log(`ℹ️  Skipping trips/fuel/expense seed — ${tripCount} trips already exist`);
  } else {
    const tripTemplates = [
      { source: 'Gandhinagar',   destination: 'Ahmedabad',   dist: 32,  cargo: 500,  rev: 4500  },
      { source: 'Ahmedabad',     destination: 'Surat',       dist: 265, cargo: 1800, rev: 18000 },
      { source: 'Surat',         destination: 'Mumbai',      dist: 280, cargo: 2200, rev: 22000 },
      { source: 'Gandhinagar',   destination: 'Rajkot',      dist: 200, cargo: 800,  rev: 9500  },
      { source: 'Rajkot',        destination: 'Jamnagar',    dist: 90,  cargo: 450,  rev: 5200  },
      { source: 'Ahmedabad',     destination: 'Vadodara',    dist: 113, cargo: 1500, rev: 12000 },
      { source: 'Vadodara',      destination: 'Surat',       dist: 156, cargo: 3000, rev: 24000 },
      { source: 'Mumbai',        destination: 'Pune',        dist: 149, cargo: 2800, rev: 21000 },
      { source: 'Gandhinagar',   destination: 'Mehsana',     dist: 52,  cargo: 700,  rev: 6000  },
      { source: 'Surat',         destination: 'Vapi',        dist: 73,  cargo: 900,  rev: 7500  },
      { source: 'Gandhinagar',   destination: 'Nadiad',      dist: 42,  cargo: 350,  rev: 3800  },
      { source: 'Ahmedabad',     destination: 'Anand',       dist: 68,  cargo: 600,  rev: 5800  },
    ];

    let tripIndex = 1;

    // Generate 3 months of completed trips (~4/week = 48 trips total)
    for (let daysBack = 90; daysBack >= 1; daysBack -= 2) {
      const template = tripTemplates[tripIndex % tripTemplates.length];
      const vehicle  = vehicles[tripIndex % vehicles.length];
      const driver   = drivers[tripIndex % drivers.length];

      const tripDate = daysAgo(daysBack);
      const code = `TR${String(tripIndex).padStart(3, '0')}`;

      const fuelLiters = Math.round((template.dist * 0.25 + Math.random() * 5) * 10) / 10;
      const fuelCost   = Math.round(fuelLiters * 96.5);
      const toll        = [0, 0, 60, 80, 120, 150][Math.floor(Math.random() * 6)];
      const other       = [0, 0, 0, 200, 350][Math.floor(Math.random() * 5)];

      const trip = await prisma.trip.create({
        data: {
          tripCode:       code,
          source:         template.source,
          destination:    template.destination,
          vehicleId:      vehicle.id,
          driverId:       driver.id,
          cargoWeight:    template.cargo,
          cargoDescription: 'General freight',
          plannedDistance:  template.dist,
          finalOdometer:    vehicle.odometer + template.dist,
          revenueAmount:    template.rev,
          status:           TripStatus.Completed,
          createdAt:        tripDate,
        },
      });

      // Fuel log
      await prisma.fuelLog.create({
        data: {
          vehicleId: vehicle.id,
          tripId:    trip.id,
          liters:    fuelLiters,
          cost:      fuelCost,
          date:      tripDate,
        },
      });

      // Expense record
      await prisma.expense.create({
        data: {
          vehicleId: vehicle.id,
          tripId:    trip.id,
          toll,
          other,
          total:     toll + other,
        },
      });

      tripIndex++;
    }

    // Also seed 5 in-progress / draft trips for active dashboard view
    const recentTemplates = [
      { source: 'Gandhinagar', destination: 'Ahmedabad', dist: 32,  cargo: 400,  rev: 4000, status: TripStatus.Dispatched },
      { source: 'Ahmedabad',   destination: 'Surat',     dist: 265, cargo: 1600, rev: 16000, status: TripStatus.Draft      },
      { source: 'Surat',       destination: 'Vapi',      dist: 73,  cargo: 800,  rev: 7000,  status: TripStatus.Draft      },
    ];

    for (const rt of recentTemplates) {
      const vehicle = vehicles[tripIndex % vehicles.length];
      const driver  = drivers[tripIndex % drivers.length];
      const code    = `TR${String(tripIndex).padStart(3, '0')}`;

      await prisma.trip.create({
        data: {
          tripCode:        code,
          source:          rt.source,
          destination:     rt.destination,
          vehicleId:       vehicle.id,
          driverId:        driver.id,
          cargoWeight:     rt.cargo,
          cargoDescription:'General freight',
          plannedDistance: rt.dist,
          revenueAmount:   rt.rev,
          status:          rt.status,
          createdAt:       daysAgo(1),
        },
      });
      tripIndex++;
    }

    console.log(`✅ Seeded ${tripIndex - 1} trips with fuel logs and expenses`);

    // ─── Maintenance Records ──────────────────────────────────────────────────
    const maintenanceRecords = [
      { vehicleReg: 'TRUCK-11', serviceType: 'Engine Overhaul',   description: 'Full engine overhaul and oil flush',        cost: 48000, status: MaintenanceStatus.Active,     date: daysAgo(10) },
      { vehicleReg: 'TRK-12',  serviceType: 'Brake Replacement', description: 'Front and rear brake pad replacement',        cost: 8500,  status: MaintenanceStatus.Completed, date: daysAgo(40) },
      { vehicleReg: 'VAN-05',  serviceType: 'Scheduled Service', description: '10,000 km service — oil, filter, tyres',      cost: 4200,  status: MaintenanceStatus.Completed, date: daysAgo(30) },
      { vehicleReg: 'TRK-07',  serviceType: 'Tyre Replacement',  description: 'Replaced 4 tyres — 295/80 R22.5',            cost: 32000, status: MaintenanceStatus.Completed, date: daysAgo(55) },
      { vehicleReg: 'VAN-14',  serviceType: 'AC Repair',         description: 'Compressor replacement',                     cost: 12000, status: MaintenanceStatus.Completed, date: daysAgo(20) },
      { vehicleReg: 'TRK-19',  serviceType: 'Scheduled Service', description: '5,000 km service — oil and filter',          cost: 3500,  status: MaintenanceStatus.Completed, date: daysAgo(15) },
      { vehicleReg: 'MINI-08', serviceType: 'Brake Replacement', description: 'Rear brake drum replacement',                cost: 4800,  status: MaintenanceStatus.Completed, date: daysAgo(60) },
    ];

    for (const m of maintenanceRecords) {
      const vehicle = await prisma.vehicle.findUnique({ where: { regNumber: m.vehicleReg } });
      if (!vehicle) continue;
      await prisma.maintenanceLog.create({
        data: {
          vehicleId:   vehicle.id,
          serviceType: m.serviceType,
          description: m.description,
          cost:        m.cost,
          status:      m.status,
          date:        m.date,
        },
      });
    }

    console.log(`✅ Seeded ${maintenanceRecords.length} maintenance records`);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n🎉 Database seeding complete!\n');
  console.log('Default Credentials:');
  console.log('────────────────────────────────────────────────────────────────');
  console.log('  Role               Email                         Password');
  console.log('────────────────────────────────────────────────────────────────');
  console.log('  Fleet Manager    → admin@transitops.com        / admin123');
  console.log('  Fleet Manager    → manager2@transitops.com     / password123');
  console.log('  Dispatcher       → dispatcher@transitops.com   / password123');
  console.log('  Dispatcher       → dispatcher2@transitops.com  / password123');
  console.log('  Safety Officer   → safety@transitops.com       / password123');
  console.log('  Safety Officer   → safety2@transitops.com      / password123');
  console.log('  Financial Analyst→ finance@transitops.com      / password123');
  console.log('────────────────────────────────────────────────────────────────');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

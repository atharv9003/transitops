import { PrismaClient, DriverStatus, VehicleStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Roles ─────────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'Fleet Manager' },
      update: {},
      create: { name: 'Fleet Manager' },
    }),
    prisma.role.upsert({
      where: { name: 'Dispatcher' },
      update: {},
      create: { name: 'Dispatcher' },
    }),
    prisma.role.upsert({
      where: { name: 'Safety Officer' },
      update: {},
      create: { name: 'Safety Officer' },
    }),
    prisma.role.upsert({
      where: { name: 'Financial Analyst' },
      update: {},
      create: { name: 'Financial Analyst' },
    }),
  ]);

  console.log(`✅ Seeded ${roles.length} roles`);

  // ─── Admin User ────────────────────────────────────────────────────────────
  const adminRole = roles.find(r => r.name === 'Fleet Manager')!;
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@transitops.com' },
    update: {},
    create: {
      email: 'admin@transitops.com',
      passwordHash,
      roleId: adminRole.id,
    },
  });

  console.log(`✅ Seeded admin user: ${admin.email}`);

  // Seed one user per remaining role for testing
  const testUsers = [
    { email: 'dispatcher@transitops.com', role: 'Dispatcher' },
    { email: 'safety@transitops.com', role: 'Safety Officer' },
    { email: 'finance@transitops.com', role: 'Financial Analyst' },
  ];

  for (const u of testUsers) {
    const role = roles.find(r => r.name === u.role)!;
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: await bcrypt.hash('password123', 10),
        roleId: role.id,
      },
    });
  }

  console.log(`✅ Seeded test users for all roles`);

  // ─── Depot Settings ────────────────────────────────────────────────────────
  const existingSettings = await prisma.depotSettings.findFirst();
  if (!existingSettings) {
    await prisma.depotSettings.create({
      data: {
        depotName: 'Gandhinagar Depot GJ4',
        currency: 'INR (Rs)',
        distanceUnit: 'Kilometers',
      },
    });
    console.log('✅ Seeded default depot settings');
  }

  // ─── Sample Vehicles ───────────────────────────────────────────────────────
  const vehicles = [
    { regNumber: 'VAN-05', name: 'Tata Ace Gold', type: 'Van', maxCapacity: 500, acquisitionCost: 850000, odometer: 12400 },
    { regNumber: 'TRK-12', name: 'Ashok Leyland Dost', type: 'Truck', maxCapacity: 2000, acquisitionCost: 1500000, odometer: 45200 },
    { regNumber: 'MINI-08', name: 'Mahindra Supro', type: 'Mini', maxCapacity: 800, acquisitionCost: 620000, odometer: 8700 },
    { regNumber: 'TRUCK-11', name: 'TATA LPT 2518', type: 'Truck', maxCapacity: 5000, acquisitionCost: 2800000, odometer: 89000, status: VehicleStatus.InShop },
    { regNumber: 'MINI-03', name: 'Piaggio Ape', type: 'Mini', maxCapacity: 400, acquisitionCost: 380000, odometer: 23400, status: VehicleStatus.Retired },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { regNumber: v.regNumber },
      update: {},
      create: { ...v, status: (v.status ?? VehicleStatus.Available) },
    });
  }

  console.log(`✅ Seeded ${vehicles.length} sample vehicles`);

  // ─── Sample Drivers ────────────────────────────────────────────────────────
  const drivers = [
    { name: 'Alex Sharma', licenseNumber: 'DL-2020-001234', licenseCategory: 'B', licenseExpiry: new Date('2027-03-15'), contactNumber: '+91 9876543210', safetyScore: 92 },
    { name: 'John Patel', licenseNumber: 'GJ-2019-005678', licenseCategory: 'C', licenseExpiry: new Date('2026-09-30'), contactNumber: '+91 9845612300', safetyScore: 88 },
    { name: 'Priya Mehta', licenseNumber: 'MH-2021-009012', licenseCategory: 'B', licenseExpiry: new Date('2028-01-20'), contactNumber: '+91 9712345678', safetyScore: 95, status: DriverStatus.OnTrip },
    { name: 'Suresh Kumar', licenseNumber: 'KA-2018-003456', licenseCategory: 'D', licenseExpiry: new Date('2025-06-01'), contactNumber: '+91 9632145870', safetyScore: 74 }, // Expired
    { name: 'Raven K.', licenseNumber: 'GJ-2022-007890', licenseCategory: 'B', licenseExpiry: new Date('2029-11-10'), contactNumber: '+91 9988776655', safetyScore: 98 },
  ];

  for (const d of drivers) {
    await prisma.driver.upsert({
      where: { licenseNumber: d.licenseNumber },
      update: {},
      create: { ...d, status: (d.status ?? DriverStatus.Available) },
    });
  }

  console.log(`✅ Seeded ${drivers.length} sample drivers`);

  console.log('\n🎉 Database seeding complete!');
  console.log('\nTest credentials:');
  console.log('  Fleet Manager  → admin@transitops.com       / admin123');
  console.log('  Dispatcher     → dispatcher@transitops.com  / password123');
  console.log('  Safety Officer → safety@transitops.com      / password123');
  console.log('  Financial Analyst → finance@transitops.com  / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

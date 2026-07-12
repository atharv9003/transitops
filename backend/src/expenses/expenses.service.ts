import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getExpenses(vehicleId?: number, tripId?: number) {
  return prisma.expense.findMany({
    where: {
      ...(vehicleId && { vehicleId }),
      ...(tripId && { tripId }),
    },
    include: {
      vehicle: { select: { regNumber: true, name: true } },
      trip: { select: { tripCode: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createExpense(data: {
  vehicleId: number;
  tripId?: number;
  toll?: number;
  other?: number;
}) {
  const toll = data.toll ?? 0;
  const other = data.other ?? 0;
  return prisma.expense.create({
    data: {
      vehicleId: data.vehicleId,
      tripId: data.tripId,
      toll,
      other,
      total: toll + other,
    },
    include: { vehicle: { select: { regNumber: true, name: true } } },
  });
}

// Total operational cost = Fuel + Maintenance per vehicle
export async function getTotalOperationalCost(vehicleId: number) {
  const [fuelResult, maintenanceResult, expenseResult] = await Promise.all([
    prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
    prisma.expense.aggregate({ where: { vehicleId }, _sum: { total: true } }),
  ]);

  const fuelCost = fuelResult._sum.cost ?? 0;
  const maintenanceCost = maintenanceResult._sum.cost ?? 0;
  const otherExpenses = expenseResult._sum.total ?? 0;

  return {
    vehicleId,
    fuelCost,
    maintenanceCost,
    otherExpenses,
    totalOperationalCost: fuelCost + maintenanceCost + otherExpenses,
  };
}

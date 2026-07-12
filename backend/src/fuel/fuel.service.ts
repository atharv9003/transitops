import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getFuelLogs(vehicleId?: number, tripId?: number) {
  return prisma.fuelLog.findMany({
    where: {
      ...(vehicleId && { vehicleId }),
      ...(tripId && { tripId }),
    },
    include: {
      vehicle: { select: { regNumber: true, name: true } },
      trip: { select: { tripCode: true } },
    },
    orderBy: { date: 'desc' },
  });
}

export async function createFuelLog(data: {
  vehicleId: number;
  tripId?: number;
  liters: number;
  cost: number;
  date: string;
}) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new Error('Vehicle not found');

  return prisma.fuelLog.create({
    data: {
      vehicleId: data.vehicleId,
      tripId: data.tripId,
      liters: data.liters,
      cost: data.cost,
      date: new Date(data.date),
    },
    include: { vehicle: { select: { regNumber: true, name: true } } },
  });
}

export async function getTotalFuelCostByVehicle(vehicleId: number): Promise<number> {
  const result = await prisma.fuelLog.aggregate({
    where: { vehicleId },
    _sum: { cost: true },
  });
  return result._sum.cost ?? 0;
}

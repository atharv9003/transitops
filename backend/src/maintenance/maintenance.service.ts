import { PrismaClient, MaintenanceStatus, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAllMaintenance(vehicleId?: number, status?: MaintenanceStatus) {
  return prisma.maintenanceLog.findMany({
    where: {
      ...(vehicleId && { vehicleId }),
      ...(status && { status }),
    },
    include: {
      vehicle: { select: { regNumber: true, name: true, status: true } },
    },
    orderBy: { date: 'desc' },
  });
}

export async function createMaintenanceRecord(data: {
  vehicleId: number;
  serviceType: string;
  description?: string;
  cost: number;
  date: string;
}) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new Error('Vehicle not found');
  if (vehicle.status === VehicleStatus.Retired) {
    throw new Error('Cannot create maintenance record for a Retired vehicle');
  }
  if (vehicle.status === VehicleStatus.OnTrip) {
    throw new Error('Cannot add vehicle to maintenance while it is On Trip');
  }

  // Business rule: creating an active maintenance record automatically sets vehicle to InShop
  return prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: VehicleStatus.InShop },
    });
    return tx.maintenanceLog.create({
      data: {
        vehicleId: data.vehicleId,
        serviceType: data.serviceType,
        description: data.description,
        cost: data.cost,
        date: new Date(data.date),
        status: MaintenanceStatus.Active,
      },
      include: { vehicle: true },
    });
  });
}

export async function closeMaintenanceRecord(id: number) {
  const record = await prisma.maintenanceLog.findUnique({
    where: { id },
    include: { vehicle: true },
  });
  if (!record) throw new Error('Maintenance record not found');
  if (record.status === MaintenanceStatus.Completed) {
    throw new Error('Maintenance record is already completed');
  }

  // Business rule: closing maintenance restores vehicle to Available (unless Retired)
  return prisma.$transaction(async (tx) => {
    const targetStatus =
      record.vehicle.status === VehicleStatus.Retired
        ? VehicleStatus.Retired
        : VehicleStatus.Available;

    await tx.vehicle.update({
      where: { id: record.vehicleId },
      data: { status: targetStatus },
    });

    return tx.maintenanceLog.update({
      where: { id },
      data: { status: MaintenanceStatus.Completed },
      include: { vehicle: true },
    });
  });
}

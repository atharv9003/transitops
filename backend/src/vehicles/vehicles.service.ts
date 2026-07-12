import { PrismaClient, VehicleStatus } from '@prisma/client';
import { CreateVehicleDto, UpdateVehicleDto, VehicleFilters } from './vehicles.types';

const prisma = new PrismaClient();

export async function getAllVehicles(filters: VehicleFilters = {}) {
  return prisma.vehicle.findMany({
    where: {
      ...(filters.type && { type: filters.type }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        OR: [
          { regNumber: { contains: filters.search } },
          { name: { contains: filters.search } },
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Only Available vehicles for dispatch selection
// Business rule: Retired or In Shop vehicles must never appear in dispatch selection
export async function getAvailableVehicles() {
  return prisma.vehicle.findMany({
    where: { status: VehicleStatus.Available },
    orderBy: { regNumber: 'asc' },
  });
}

export async function getVehicleById(id: number) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new Error('Vehicle not found');
  return vehicle;
}

export async function createVehicle(dto: CreateVehicleDto) {
  // Business rule: registration number must be unique (enforced by DB unique constraint)
  return prisma.vehicle.create({ data: dto });
}

export async function updateVehicle(id: number, dto: UpdateVehicleDto) {
  await getVehicleById(id); // ensure exists
  return prisma.vehicle.update({ where: { id }, data: dto });
}

export async function deleteVehicle(id: number) {
  const vehicle = await getVehicleById(id);
  if (vehicle.status === VehicleStatus.OnTrip) {
    throw new Error('Cannot delete a vehicle that is currently On Trip');
  }
  return prisma.vehicle.delete({ where: { id } });
}

export async function addVehicleDocument(
  id: number,
  doc: { filename: string; url: string; type: string }
) {
  const vehicle = await getVehicleById(id);
  const existing = (vehicle.documents as Array<Record<string, unknown>>) || [];
  const updated = [...existing, { ...doc, uploadedAt: new Date().toISOString() }];
  return prisma.vehicle.update({
    where: { id },
    data: { documents: updated },
  });
}

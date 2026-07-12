import { PrismaClient, TripStatus, VehicleStatus, DriverStatus } from '@prisma/client';
import { CreateTripDto, CompleteTripDto, TripFilters } from './trips.types';

const prisma = new PrismaClient();

// Generate trip code: TR001, TR002, etc.
async function generateTripCode(): Promise<string> {
  const count = await prisma.trip.count();
  return `TR${String(count + 1).padStart(3, '0')}`;
}

export async function getAllTrips(filters: TripFilters = {}) {
  return prisma.trip.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.driverId && { driverId: filters.driverId }),
      ...(filters.search && {
        OR: [
          { tripCode: { contains: filters.search } },
          { source: { contains: filters.search } },
          { destination: { contains: filters.search } },
        ],
      }),
    },
    include: {
      vehicle: { select: { regNumber: true, name: true, maxCapacity: true } },
      driver: { select: { name: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTripById(id: number) {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: true, driver: true, expenses: true, fuelLogs: true },
  });
  if (!trip) throw new Error('Trip not found');
  return trip;
}

export async function createTrip(dto: CreateTripDto) {
  // Business rule: validate vehicle
  const vehicle = await prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
  if (!vehicle) throw new Error('Vehicle not found');
  if (vehicle.status !== VehicleStatus.Available) {
    throw new Error(`Vehicle is not available (current status: ${vehicle.status})`);
  }

  // Business rule: cargo weight must not exceed max capacity
  if (dto.cargoWeight > vehicle.maxCapacity) {
    throw new Error(
      `Cargo weight (${dto.cargoWeight} kg) exceeds vehicle capacity (${vehicle.maxCapacity} kg). Dispatch blocked.`
    );
  }

  // Business rule: validate driver
  const driver = await prisma.driver.findUnique({ where: { id: dto.driverId } });
  if (!driver) throw new Error('Driver not found');
  if (driver.status !== DriverStatus.Available) {
    throw new Error(`Driver is not available (current status: ${driver.status})`);
  }
  if (new Date(driver.licenseExpiry) < new Date()) {
    throw new Error(`Driver's license has expired (expired: ${driver.licenseExpiry.toDateString()})`);
  }

  const tripCode = await generateTripCode();
  return prisma.trip.create({
    data: {
      tripCode,
      source: dto.source,
      destination: dto.destination,
      vehicleId: dto.vehicleId,
      driverId: dto.driverId,
      cargoWeight: dto.cargoWeight,
      cargoDescription: dto.cargoDescription,
      plannedDistance: dto.plannedDistance,
      revenueAmount: dto.revenueAmount ?? 0,
      status: TripStatus.Draft,
    },
    include: { vehicle: true, driver: true },
  });
}

export async function dispatchTrip(id: number) {
  const trip = await getTripById(id);
  if (trip.status !== TripStatus.Draft) {
    throw new Error(`Cannot dispatch a trip with status: ${trip.status}`);
  }

  // Re-validate availability (may have changed since Draft)
  const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
  const driver = trip.driverId ? await prisma.driver.findUnique({ where: { id: trip.driverId } }) : null;

  if (vehicle?.status !== VehicleStatus.Available) {
    throw new Error('Vehicle is no longer available for dispatch');
  }
  if (driver && driver.status !== DriverStatus.Available) {
    throw new Error('Driver is no longer available for dispatch');
  }
  if (driver && new Date(driver.licenseExpiry) < new Date()) {
    throw new Error("Driver's license has expired");
  }
  if (trip.cargoWeight > (vehicle?.maxCapacity ?? 0)) {
    throw new Error('Cargo weight exceeds vehicle capacity');
  }

  // Business rule: dispatching sets both vehicle and driver to OnTrip atomically
  return prisma.$transaction(async (tx) => {
    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.OnTrip } });
    if (trip.driverId) {
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.OnTrip } });
    }
    return tx.trip.update({ where: { id }, data: { status: TripStatus.Dispatched } });
  });
}

export async function completeTrip(id: number, dto: CompleteTripDto) {
  const trip = await getTripById(id);
  if (trip.status !== TripStatus.Dispatched) {
    throw new Error(`Cannot complete a trip with status: ${trip.status}`);
  }

  // Business rule: completing a trip restores vehicle and driver to Available
  // Also: creates FuelLog and Expense records (completion cascade)
  return prisma.$transaction(async (tx) => {
    // Update vehicle odometer and status
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: VehicleStatus.Available, odometer: dto.finalOdometer },
    });

    // Restore driver status
    if (trip.driverId) {
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.Available } });
    }

    // Create fuel log for this trip
    await tx.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        tripId: id,
        liters: dto.fuelLiters,
        cost: dto.fuelCost,
        date: new Date(),
      },
    });

    // Create expense record for this trip
    const toll = dto.toll ?? 0;
    const other = dto.otherExpense ?? 0;
    await tx.expense.create({
      data: {
        vehicleId: trip.vehicleId,
        tripId: id,
        toll,
        other,
        total: toll + other,
      },
    });

    return tx.trip.update({
      where: { id },
      data: { status: TripStatus.Completed, finalOdometer: dto.finalOdometer },
    });
  });
}

export async function cancelTrip(id: number) {
  const trip = await getTripById(id);
  if (trip.status === TripStatus.Completed) {
    throw new Error('Cannot cancel a completed trip');
  }

  return prisma.$transaction(async (tx) => {
    // Restore vehicle and driver if dispatched
    if (trip.status === TripStatus.Dispatched) {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.Available } });
      if (trip.driverId) {
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.Available } });
      }
    }
    return tx.trip.update({ where: { id }, data: { status: TripStatus.Cancelled } });
  });
}

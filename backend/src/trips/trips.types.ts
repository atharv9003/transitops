import { TripStatus } from '@prisma/client';

export interface CreateTripDto {
  source: string;
  destination: string;
  vehicleId: number;
  driverId: number;
  cargoWeight: number;
  cargoDescription?: string;
  plannedDistance: number;
  revenueAmount?: number;
}

export interface CompleteTripDto {
  finalOdometer: number;
  fuelLiters: number;
  fuelCost: number;
  toll?: number;
  otherExpense?: number;
}

export interface TripFilters {
  status?: TripStatus;
  vehicleId?: number;
  driverId?: number;
  search?: string;
}

import { VehicleStatus } from '@prisma/client';

export interface CreateVehicleDto {
  regNumber: string;
  name: string;
  type: string;
  maxCapacity: number;
  odometer?: number;
  acquisitionCost: number;
  status?: VehicleStatus;
}

export interface UpdateVehicleDto {
  name?: string;
  type?: string;
  maxCapacity?: number;
  odometer?: number;
  acquisitionCost?: number;
  status?: VehicleStatus;
}

export interface VehicleFilters {
  type?: string;
  status?: VehicleStatus;
  search?: string;
}

import { DriverStatus } from '@prisma/client';

export interface CreateDriverDto {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string; // ISO date string
  contactNumber: string;
  safetyScore?: number;
  status?: DriverStatus;
}

export interface UpdateDriverDto {
  name?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: string;
  contactNumber?: string;
  safetyScore?: number;
  status?: DriverStatus;
}

export interface DriverFilters {
  status?: DriverStatus;
  search?: string;
  licenseExpiringSoon?: boolean;
}

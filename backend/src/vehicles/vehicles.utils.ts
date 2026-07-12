import { VehicleStatus } from '@prisma/client';

/**
 * Returns true if a vehicle status allows dispatch selection
 * Business rule: Retired or In Shop vehicles must never appear in dispatch selection
 */
export function isDispatchable(status: VehicleStatus): boolean {
  return status === VehicleStatus.Available;
}

/**
 * Returns a human-readable label for vehicle status
 */
export function vehicleStatusLabel(status: VehicleStatus): string {
  const labels: Record<VehicleStatus, string> = {
    Available: 'Available',
    OnTrip: 'On Trip',
    InShop: 'In Shop',
    Retired: 'Retired',
  };
  return labels[status] ?? status;
}

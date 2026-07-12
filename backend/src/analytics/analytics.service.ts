import { PrismaClient, VehicleStatus, DriverStatus, TripStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDashboardKpis() {
  const [vehicles, drivers, trips] = await Promise.all([
    prisma.vehicle.findMany({ select: { status: true } }),
    prisma.driver.findMany({ select: { status: true } }),
    prisma.trip.findMany({ select: { status: true } }),
  ]);

  const activeVehicles = vehicles.filter(v => v.status === VehicleStatus.OnTrip).length;
  const availableVehicles = vehicles.filter(v => v.status === VehicleStatus.Available).length;
  const inMaintenanceVehicles = vehicles.filter(v => v.status === VehicleStatus.InShop).length;
  const retiredVehicles = vehicles.filter(v => v.status === VehicleStatus.Retired).length;
  const totalVehicles = vehicles.length;

  const activeTrips = trips.filter(t => t.status === TripStatus.Dispatched).length;
  const pendingTrips = trips.filter(t => t.status === TripStatus.Draft).length;
  const driversOnDuty = drivers.filter(d => d.status === DriverStatus.OnTrip).length;

  const fleetUtilization = totalVehicles > 0
    ? Math.round((activeVehicles / totalVehicles) * 100)
    : 0;

  return {
    activeVehicles,
    availableVehicles,
    inMaintenanceVehicles,
    retiredVehicles,
    totalVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization,
    vehicleStatusBreakdown: { available: availableVehicles, onTrip: activeVehicles, inShop: inMaintenanceVehicles, retired: retiredVehicles },
  };
}

export async function getAnalyticsReport() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      fuelLogs: true,
      maintenanceLogs: true,
      expenses: true,
      trips: { where: { status: TripStatus.Completed } },
    },
  });

  const vehicleReports = vehicles.map(v => {
    const totalFuel = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const totalFuelLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
    const totalMaintenance = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
    const totalOtherExpenses = v.expenses.reduce((s, e) => s + e.total, 0);
    const totalRevenue = v.trips.reduce((s, t) => s + t.revenueAmount, 0);
    const totalDistance = v.trips.reduce((s, t) => s + t.plannedDistance, 0);
    const operationalCost = totalFuel + totalMaintenance + totalOtherExpenses;
    const roi = v.acquisitionCost > 0
      ? ((totalRevenue - (totalMaintenance + totalFuel)) / v.acquisitionCost) * 100
      : 0;
    const fuelEfficiency = totalFuelLiters > 0 ? totalDistance / totalFuelLiters : 0;

    return {
      vehicleId: v.id,
      regNumber: v.regNumber,
      name: v.name,
      acquisitionCost: v.acquisitionCost,
      totalRevenue,
      totalFuelCost: totalFuel,
      totalFuelLiters,
      totalMaintenanceCost: totalMaintenance,
      operationalCost,
      fuelEfficiency: Math.round(fuelEfficiency * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      completedTrips: v.trips.length,
    };
  });

  const totalFuelEfficiency = vehicleReports.filter(v => v.fuelEfficiency > 0);
  const avgFuelEfficiency = totalFuelEfficiency.length > 0
    ? totalFuelEfficiency.reduce((s, v) => s + v.fuelEfficiency, 0) / totalFuelEfficiency.length
    : 0;

  const totalOperationalCost = vehicleReports.reduce((s, v) => s + v.operationalCost, 0);

  // Monthly revenue: group completed trips by month
  const completedTrips = await prisma.trip.findMany({
    where: { status: TripStatus.Completed },
    select: { createdAt: true, revenueAmount: true },
  });

  const monthlyRevenue: Record<string, number> = {};
  for (const trip of completedTrips) {
    const month = trip.createdAt.toISOString().slice(0, 7); // "2026-07"
    monthlyRevenue[month] = (monthlyRevenue[month] ?? 0) + trip.revenueAmount;
  }

  const kpis = await getDashboardKpis();

  return {
    kpis,
    avgFuelEfficiency: Math.round(avgFuelEfficiency * 100) / 100,
    totalOperationalCost: Math.round(totalOperationalCost),
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
    topCostliestVehicles: [...vehicleReports]
      .sort((a, b) => b.operationalCost - a.operationalCost)
      .slice(0, 5),
    vehicleReports,
  };
}

export function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
}

import { PrismaClient, DriverStatus } from '@prisma/client';
import { CreateDriverDto, UpdateDriverDto, DriverFilters } from './drivers.types';
import { sendLicenseExpiryReminder } from '../notifications/email.service';

const prisma = new PrismaClient();

export function isLicenseExpired(expiry: Date): boolean {
  return new Date(expiry) < new Date();
}

export function isLicenseExpiringSoon(expiry: Date, withinDays = 30): boolean {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + withinDays);
  return new Date(expiry) <= threshold && !isLicenseExpired(expiry);
}

export async function getAllDrivers(filters: DriverFilters = {}) {
  const drivers = await prisma.driver.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search } },
          { licenseNumber: { contains: filters.search } },
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
  });

  return drivers.map(d => ({
    ...d,
    licenseExpired: isLicenseExpired(d.licenseExpiry),
    licenseExpiringSoon: isLicenseExpiringSoon(d.licenseExpiry),
  }));
}

// Only drivers eligible for dispatch
// Business rule: Drivers with expired licenses or Suspended status cannot be assigned
export async function getAvailableDrivers() {
  const today = new Date();
  return prisma.driver.findMany({
    where: {
      status: DriverStatus.Available,
      licenseExpiry: { gt: today }, // not expired
    },
    orderBy: { name: 'asc' },
  });
}

export async function getDriverById(id: number) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new Error('Driver not found');
  return driver;
}

export async function createDriver(dto: CreateDriverDto) {
  return prisma.driver.create({
    data: {
      ...dto,
      licenseExpiry: new Date(dto.licenseExpiry),
    },
  });
}

export async function updateDriver(id: number, dto: UpdateDriverDto) {
  await getDriverById(id);
  return prisma.driver.update({
    where: { id },
    data: {
      ...dto,
      ...(dto.licenseExpiry && { licenseExpiry: new Date(dto.licenseExpiry) }),
    },
  });
}

export async function deleteDriver(id: number) {
  const driver = await getDriverById(id);
  if (driver.status === DriverStatus.OnTrip) {
    throw new Error('Cannot delete a driver that is currently On Trip');
  }
  return prisma.driver.delete({ where: { id } });
}

// Called by cron job — scan for licenses expiring within 30 days and email
export async function checkAndNotifyExpiringLicenses() {
  const drivers = await getAllDrivers({ licenseExpiringSoon: true });
  const expiringSoon = drivers.filter(d => d.licenseExpiringSoon);

  for (const driver of expiringSoon) {
    try {
      await sendLicenseExpiryReminder(driver.name, driver.licenseExpiry, driver.contactNumber);
    } catch (err) {
      console.error(`Failed to send reminder for driver ${driver.name}:`, err);
    }
  }

  return expiringSoon.length;
}

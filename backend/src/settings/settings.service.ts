import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSettings() {
  const settings = await prisma.depotSettings.findFirst();
  if (!settings) {
    // Create default if not exists
    return prisma.depotSettings.create({
      data: { depotName: 'Main Depot', currency: 'INR (Rs)', distanceUnit: 'Kilometers' },
    });
  }
  return settings;
}

export async function updateSettings(data: {
  depotName?: string;
  currency?: string;
  distanceUnit?: string;
}) {
  const settings = await getSettings();
  return prisma.depotSettings.update({
    where: { id: settings.id },
    data,
  });
}

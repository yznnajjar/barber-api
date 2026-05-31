import { PrismaClient, Weekday } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { addDays, addMinutes, setHours, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Seeds one demo salon owner + salon with services, staff, clients,
 * a few bookings and a live queue, so the API has something to return
 * immediately after `npm run db:seed`.
 *
 *   Login:  owner@salon.com / password123
 */
async function main(): Promise<void> {
  console.log('Seeding...');

  const passwordHash = await bcrypt.hash('password123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@salon.com' },
    update: {},
    create: { email: 'owner@salon.com', passwordHash, fullName: 'Salon Owner', role: 'SALON_OWNER' },
  });

  const salon = await prisma.salon.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: { name: 'Downtown Barbers', nameAr: 'حلاقو وسط البلد', ownerId: owner.id },
  });

  // wipe child data for idempotent re-seeds
  await prisma.queueEntry.deleteMany({ where: { salonId: salon.id } });
  await prisma.booking.deleteMany({ where: { salonId: salon.id } });
  await prisma.client.deleteMany({ where: { salonId: salon.id } });
  await prisma.staff.deleteMany({ where: { salonId: salon.id } });
  await prisma.service.deleteMany({ where: { salonId: salon.id } });

  const haircut = await prisma.service.create({
    data: { salonId: salon.id, name: 'Haircut', nameAr: 'قص شعر', durationMinutes: 30, priceFils: 5000 },
  });
  const beard = await prisma.service.create({
    data: { salonId: salon.id, name: 'Beard Trim', nameAr: 'تهذيب لحية', durationMinutes: 20, priceFils: 3000 },
  });

  const weekdays: Weekday[] = ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'];
  const sami = await prisma.staff.create({
    data: {
      salonId: salon.id,
      fullName: 'Sami Hassan',
      role: 'Senior Barber',
      staffServices: { create: [{ serviceId: haircut.id }, { serviceId: beard.id }] },
      workingHours: { create: weekdays.map((weekday) => ({ weekday, startTime: '09:00', endTime: '18:00', isOpen: true })) },
    },
  });

  const ahmad = await prisma.client.create({
    data: { salonId: salon.id, fullName: 'Ahmad Ali', phone: '+962790000001' },
  });
  const omar = await prisma.client.create({
    data: { salonId: salon.id, fullName: 'Omar Nasser', phone: '+962790000002' },
  });

  const today = startOfDay(new Date());
  await prisma.booking.createMany({
    data: [
      {
        salonId: salon.id, clientId: ahmad.id, staffId: sami.id, serviceId: haircut.id,
        startAt: setHours(today, 10), endAt: addMinutes(setHours(today, 10), 30),
        status: 'COMPLETED', priceFils: 5000,
      },
      {
        salonId: salon.id, clientId: omar.id, staffId: sami.id, serviceId: beard.id,
        startAt: setHours(addDays(today, 0), 12), endAt: addMinutes(setHours(today, 12), 20),
        status: 'CONFIRMED', priceFils: 3000,
      },
    ],
  });

  await prisma.queueEntry.create({
    data: { salonId: salon.id, clientId: ahmad.id, serviceId: haircut.id, position: 1, estimatedWaitMin: 0 },
  });

  await prisma.activityLog.create({
    data: { salonId: salon.id, type: 'BOOKING_CREATED', message: 'New booking for Ahmad Ali' },
  });

  console.log('Seed complete. Login: owner@salon.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

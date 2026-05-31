import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkingHourDto } from '../dto/working-hour.dto';

export type StaffWithRelations = Prisma.StaffGetPayload<{
  include: { workingHours: true; staffServices: { include: { service: true } } };
}>;

export abstract class StaffRepository {
  abstract findAll(salonId: string): Promise<StaffWithRelations[]>;
  abstract findOne(salonId: string, id: string): Promise<StaffWithRelations | null>;
  abstract create(
    salonId: string,
    data: { fullName: string; role?: string },
    serviceIds: string[],
    hours: WorkingHourDto[],
  ): Promise<StaffWithRelations>;
  abstract update(
    id: string,
    data: { fullName?: string; role?: string },
    serviceIds: string[] | undefined,
    hours: WorkingHourDto[] | undefined,
  ): Promise<StaffWithRelations>;
}

@Injectable()
export class PrismaStaffRepository extends StaffRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private readonly include = {
    workingHours: true,
    staffServices: { include: { service: true } },
  } satisfies Prisma.StaffInclude;

  findAll(salonId: string): Promise<StaffWithRelations[]> {
    return this.prisma.staff.findMany({
      where: { salonId },
      include: this.include,
      orderBy: { fullName: 'asc' },
    });
  }

  findOne(salonId: string, id: string): Promise<StaffWithRelations | null> {
    return this.prisma.staff.findFirst({ where: { id, salonId }, include: this.include });
  }

  create(
    salonId: string,
    data: { fullName: string; role?: string },
    serviceIds: string[],
    hours: WorkingHourDto[],
  ): Promise<StaffWithRelations> {
    return this.prisma.staff.create({
      data: {
        salon: { connect: { id: salonId } },
        fullName: data.fullName,
        role: data.role ?? 'Barber',
        staffServices: { create: serviceIds.map((serviceId) => ({ serviceId })) },
        workingHours: { create: hours },
      },
      include: this.include,
    });
  }

  /** Replace-on-write for the relations keeps the update idempotent and simple. */
  async update(
    id: string,
    data: { fullName?: string; role?: string },
    serviceIds: string[] | undefined,
    hours: WorkingHourDto[] | undefined,
  ): Promise<StaffWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      await tx.staff.update({ where: { id }, data });

      if (serviceIds) {
        await tx.staffService.deleteMany({ where: { staffId: id } });
        await tx.staffService.createMany({
          data: serviceIds.map((serviceId) => ({ staffId: id, serviceId })),
        });
      }
      if (hours) {
        await tx.workingHour.deleteMany({ where: { staffId: id } });
        await tx.workingHour.createMany({
          data: hours.map((h) => ({ ...h, staffId: id })),
        });
      }
      return tx.staff.findUniqueOrThrow({ where: { id }, include: this.include });
    });
  }
}

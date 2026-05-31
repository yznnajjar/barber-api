import { Injectable } from '@nestjs/common';
import { Prisma, Service } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/** Persistence contract for services — services layer depends on this. */
export abstract class ServicesRepository {
  abstract findAll(salonId: string): Promise<Service[]>;
  abstract findOne(salonId: string, id: string): Promise<Service | null>;
  abstract create(salonId: string, data: Prisma.ServiceCreateInput): Promise<Service>;
  abstract update(id: string, data: Prisma.ServiceUpdateInput): Promise<Service>;
  abstract remove(id: string): Promise<void>;
}

@Injectable()
export class PrismaServicesRepository extends ServicesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findAll(salonId: string): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: { salonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(salonId: string, id: string): Promise<Service | null> {
    return this.prisma.service.findFirst({ where: { id, salonId } });
  }

  create(salonId: string, data: Prisma.ServiceCreateInput): Promise<Service> {
    return this.prisma.service.create({
      data: { ...data, salon: { connect: { id: salonId } } },
    });
  }

  update(id: string, data: Prisma.ServiceUpdateInput): Promise<Service> {
    return this.prisma.service.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.service.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { Booking, Client, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ClientWithStats extends Client {
  totalVisits: number;
  totalSpentFils: number;
  lastVisitAt: Date | null;
}

export abstract class ClientsRepository {
  abstract search(
    salonId: string,
    search: string | undefined,
    skip: number,
    take: number,
  ): Promise<{ rows: Client[]; total: number }>;
  abstract findOne(salonId: string, id: string): Promise<Client | null>;
  abstract findByPhone(salonId: string, phone: string): Promise<Client | null>;
  abstract create(salonId: string, data: Prisma.ClientCreateInput): Promise<Client>;
  abstract update(id: string, data: Prisma.ClientUpdateInput): Promise<Client>;
  abstract stats(clientId: string): Promise<{ visits: number; spentFils: number; last: Date | null }>;
  /** Batched stats for many clients in ONE query (avoids N+1 on the list). */
  abstract statsFor(
    clientIds: string[],
  ): Promise<Map<string, { visits: number; spentFils: number; last: Date | null }>>;
  abstract history(clientId: string): Promise<Booking[]>;
}

@Injectable()
export class PrismaClientsRepository extends ClientsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async search(salonId: string, search: string | undefined, skip: number, take: number) {
    const where: Prisma.ClientWhereInput = {
      salonId,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({ where, skip, take, orderBy: { fullName: 'asc' } }),
      this.prisma.client.count({ where }),
    ]);
    return { rows, total };
  }

  findOne(salonId: string, id: string): Promise<Client | null> {
    return this.prisma.client.findFirst({ where: { id, salonId } });
  }

  findByPhone(salonId: string, phone: string): Promise<Client | null> {
    return this.prisma.client.findFirst({ where: { salonId, phone } });
  }

  create(salonId: string, data: Prisma.ClientCreateInput): Promise<Client> {
    return this.prisma.client.create({
      data: { ...data, salon: { connect: { id: salonId } } },
    });
  }

  update(id: string, data: Prisma.ClientUpdateInput): Promise<Client> {
    return this.prisma.client.update({ where: { id }, data });
  }

  /** Aggregate visit count + spend from completed bookings. */
  async stats(clientId: string) {
    const completed = await this.prisma.booking.aggregate({
      where: { clientId, status: 'COMPLETED' },
      _count: { _all: true },
      _sum: { priceFils: true },
      _max: { startAt: true },
    });
    return {
      visits: completed._count._all,
      spentFils: completed._sum.priceFils ?? 0,
      last: completed._max.startAt,
    };
  }

  /**
   * One grouped query for every client on the page, instead of one query per
   * client. Returns a Map keyed by clientId; clients with no completed
   * bookings simply won't appear (the caller defaults them to zero).
   */
  async statsFor(clientIds: string[]) {
    const result = new Map<string, { visits: number; spentFils: number; last: Date | null }>();
    if (clientIds.length === 0) return result;

    const grouped = await this.prisma.booking.groupBy({
      by: ['clientId'],
      where: { clientId: { in: clientIds }, status: 'COMPLETED' },
      _count: { _all: true },
      _sum: { priceFils: true },
      _max: { startAt: true },
    });

    for (const g of grouped) {
      result.set(g.clientId, {
        visits: g._count._all,
        spentFils: g._sum.priceFils ?? 0,
        last: g._max.startAt,
      });
    }
    return result;
  }

  history(clientId: string): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: { clientId },
      orderBy: { startAt: 'desc' },
      take: 50,
      include: { service: true, staff: true },
    });
  }
}

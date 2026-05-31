import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DateRange } from '../period.strategy';

export interface RevenuePoint {
  date: string;
  revenueFils: number;
}
export interface TopService {
  serviceId: string;
  name: string;
  bookings: number;
}
export interface TopClient {
  clientId: string;
  name: string;
  spentFils: number;
  visits: number;
}

export abstract class AnalyticsRepository {
  abstract summary(salonId: string, range: DateRange): Promise<{
    revenueFils: number;
    bookings: number;
    newClients: number;
  }>;
  abstract revenueByDay(salonId: string, range: DateRange): Promise<RevenuePoint[]>;
  abstract topServices(salonId: string, range: DateRange): Promise<TopService[]>;
  abstract topClients(salonId: string, range: DateRange): Promise<TopClient[]>;
}

@Injectable()
export class PrismaAnalyticsRepository extends AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async summary(salonId: string, { from, to }: DateRange) {
    const [revenue, bookings, newClients] = await Promise.all([
      this.prisma.booking.aggregate({
        where: { salonId, status: BookingStatus.COMPLETED, startAt: { gte: from, lte: to } },
        _sum: { priceFils: true },
      }),
      this.prisma.booking.count({ where: { salonId, startAt: { gte: from, lte: to } } }),
      this.prisma.client.count({ where: { salonId, createdAt: { gte: from, lte: to } } }),
    ]);
    return {
      revenueFils: revenue._sum.priceFils ?? 0,
      bookings,
      newClients,
    };
  }

  /** Daily revenue series via grouped raw query (Postgres date_trunc). */
  async revenueByDay(salonId: string, { from, to }: DateRange): Promise<RevenuePoint[]> {
    const rows = await this.prisma.$queryRaw<{ day: Date; revenue: bigint }[]>`
      SELECT date_trunc('day', "startAt") AS day, COALESCE(SUM("priceFils"), 0) AS revenue
      FROM "bookings"
      WHERE "salonId" = ${salonId}
        AND "status" = 'COMPLETED'
        AND "startAt" BETWEEN ${from} AND ${to}
      GROUP BY day
      ORDER BY day ASC;
    `;
    return rows.map((r) => ({
      date: r.day.toISOString().slice(0, 10),
      revenueFils: Number(r.revenue),
    }));
  }

  async topServices(salonId: string, { from, to }: DateRange): Promise<TopService[]> {
    const grouped = await this.prisma.booking.groupBy({
      by: ['serviceId'],
      where: { salonId, startAt: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: 5,
    });
    const services = await this.prisma.service.findMany({
      where: { id: { in: grouped.map((g) => g.serviceId) } },
    });
    const nameOf = new Map(services.map((s) => [s.id, s.name]));
    return grouped.map((g) => ({
      serviceId: g.serviceId,
      name: nameOf.get(g.serviceId) ?? 'Unknown',
      bookings: g._count._all,
    }));
  }

  async topClients(salonId: string, { from, to }: DateRange): Promise<TopClient[]> {
    const grouped = await this.prisma.booking.groupBy({
      by: ['clientId'],
      where: { salonId, status: BookingStatus.COMPLETED, startAt: { gte: from, lte: to } },
      _sum: { priceFils: true },
      _count: { _all: true },
      orderBy: { _sum: { priceFils: 'desc' } },
      take: 5,
    });
    const clients = await this.prisma.client.findMany({
      where: { id: { in: grouped.map((g) => g.clientId) } },
    });
    const nameOf = new Map(clients.map((c) => [c.id, c.fullName]));
    return grouped.map((g) => ({
      clientId: g.clientId,
      name: nameOf.get(g.clientId) ?? 'Unknown',
      spentFils: g._sum.priceFils ?? 0,
      visits: g._count._all,
    }));
  }
}

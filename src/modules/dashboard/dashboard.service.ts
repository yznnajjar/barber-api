import { Injectable } from '@nestjs/common';
import { BookingStatus, QueueStatus } from '@prisma/client';
import { endOfDay, startOfDay } from 'date-fns';
import { filsToJod } from '../../common/dto/money.util';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

/**
 * Aggregates the four stat cards + upcoming list + recent activity for the
 * dashboard home. Result is cached in Redis for 60s; the cache key is salon
 * scoped so invalidation is targeted (see `invalidate`).
 */
@Injectable()
export class DashboardService {
  private static readonly TTL_SECONDS = 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private cacheKey(salonId: string): string {
    return `dashboard:stats:${salonId}`;
  }

  async overview(salonId: string) {
    const cached = await this.redis.get(this.cacheKey(salonId));
    if (cached) return cached;

    const now = new Date();
    const from = startOfDay(now);
    const to = endOfDay(now);

    const [todaysBookings, revenueAgg, queueLength, newClients, upcoming, activity] =
      await Promise.all([
        this.prisma.booking.count({ where: { salonId, startAt: { gte: from, lte: to } } }),
        this.prisma.booking.aggregate({
          where: { salonId, status: BookingStatus.COMPLETED, startAt: { gte: from, lte: to } },
          _sum: { priceFils: true },
        }),
        this.prisma.queueEntry.count({ where: { salonId, status: QueueStatus.WAITING } }),
        this.prisma.client.count({ where: { salonId, createdAt: { gte: from, lte: to } } }),
        this.prisma.booking.findMany({
          where: { salonId, startAt: { gte: now }, status: { not: BookingStatus.CANCELLED } },
          include: { client: true, staff: true, service: true },
          orderBy: { startAt: 'asc' },
          take: 5,
        }),
        this.prisma.activityLog.findMany({
          where: { salonId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

    const result = {
      stats: {
        todaysBookings,
        todaysRevenueJod: filsToJod(revenueAgg._sum.priceFils ?? 0),
        queueLength,
        newClients,
      },
      upcoming: upcoming.map((b) => ({
        id: b.id,
        time: b.startAt,
        client: b.client.fullName,
        service: b.service.name,
        staff: b.staff.fullName,
      })),
      recentActivity: activity.map((a) => ({
        type: a.type,
        message: a.message,
        at: a.createdAt,
      })),
    };

    await this.redis.set(this.cacheKey(salonId), result, DashboardService.TTL_SECONDS);
    return result;
  }

  /** Call after any mutation that changes the numbers above. */
  async invalidate(salonId: string): Promise<void> {
    await this.redis.del(this.cacheKey(salonId));
  }
}

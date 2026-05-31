import { Injectable } from '@nestjs/common';
import { filsToJod } from '../../common/dto/money.util';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';
import { resolvePeriod } from './period.strategy';
import { AnalyticsRepository } from './repositories/analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  async report(salonId: string, query: QueryAnalyticsDto) {
    const range = resolvePeriod(query.period);

    const [summary, revenueSeries, topServices, topClients] = await Promise.all([
      this.repo.summary(salonId, range),
      this.repo.revenueByDay(salonId, range),
      this.repo.topServices(salonId, range),
      this.repo.topClients(salonId, range),
    ]);

    return {
      period: query.period,
      range,
      summary: {
        totalRevenueJod: filsToJod(summary.revenueFils),
        totalBookings: summary.bookings,
        newClients: summary.newClients,
        avgBookingValueJod: summary.bookings
          ? filsToJod(summary.revenueFils) / summary.bookings
          : 0,
      },
      revenueSeries: revenueSeries.map((p) => ({ date: p.date, revenueJod: filsToJod(p.revenueFils) })),
      topServices,
      topClients: topClients.map((c) => ({
        clientId: c.clientId,
        name: c.name,
        spentJod: filsToJod(c.spentFils),
        visits: c.visits,
      })),
    };
  }
}

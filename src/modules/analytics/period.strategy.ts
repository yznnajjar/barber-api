import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { AnalyticsPeriod } from './dto/query-analytics.dto';

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Open/Closed in action: each period is a self-contained resolver in this map.
 * Adding "quarter" or "year" means adding one entry here — no edits to the
 * AnalyticsService that consumes it.
 */
export const PERIOD_RESOLVERS: Record<AnalyticsPeriod, (now: Date) => DateRange> = {
  [AnalyticsPeriod.TODAY]: (now) => ({ from: startOfDay(now), to: endOfDay(now) }),
  [AnalyticsPeriod.WEEK]: (now) => ({
    from: startOfWeek(now, { weekStartsOn: 6 }),
    to: endOfWeek(now, { weekStartsOn: 6 }),
  }),
  [AnalyticsPeriod.MONTH]: (now) => ({ from: startOfMonth(now), to: endOfMonth(now) }),
};

export function resolvePeriod(period: AnalyticsPeriod, now = new Date()): DateRange {
  return PERIOD_RESOLVERS[period](now);
}

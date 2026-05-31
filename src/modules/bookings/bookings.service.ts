import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { addDays, addMinutes, endOfDay, parseISO, startOfDay, startOfWeek } from 'date-fns';
import { filsToJod } from '../../common/dto/money.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarView, QueryBookingsDto } from './dto/query-bookings.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { BookingsRepository, BookingWithRelations } from './repositories/bookings.repository';

@Injectable()
export class BookingsService {
  constructor(
    private readonly repo: BookingsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /** Calendar feed: resolves the [from, to) window from view + anchor date. */
  async calendar(salonId: string, query: QueryBookingsDto) {
    const anchor = parseISO(query.date);
    const from = query.view === CalendarView.WEEK ? startOfWeek(anchor, { weekStartsOn: 6 }) : startOfDay(anchor);
    const to = query.view === CalendarView.WEEK ? addDays(from, 7) : endOfDay(anchor);

    const rows = await this.repo.findInRange(salonId, from, to);
    return rows.map((b) => this.toView(b));
  }

  async findOne(salonId: string, id: string) {
    const row = await this.repo.findOne(salonId, id);
    if (!row) throw new NotFoundException('Booking not found');
    return this.toView(row);
  }

  /** Create: validates service ownership, computes endAt, blocks double-booking. */
  async create(salonId: string, dto: CreateBookingDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, salonId },
    });
    if (!service) throw new BadRequestException('Service does not belong to this salon');

    const start = parseISO(dto.startAt);
    const end = addMinutes(start, service.durationMinutes);

    if (await this.repo.hasOverlap(dto.staffId, start, end)) {
      throw new ConflictException('Staff member is already booked in this slot');
    }

    const created = await this.repo.create({
      salonId,
      clientId: dto.clientId,
      staffId: dto.staffId,
      serviceId: dto.serviceId,
      startAt: start,
      endAt: end,
      status: BookingStatus.PENDING,
      priceFils: service.priceFils,
    });
    return this.toView(created);
  }

  /** Move a booking, re-checking the new slot for clashes. */
  async reschedule(salonId: string, id: string, dto: RescheduleBookingDto) {
    const existing = await this.repo.findOne(salonId, id);
    if (!existing) throw new NotFoundException('Booking not found');

    const start = parseISO(dto.startAt);
    const end = addMinutes(start, existing.service.durationMinutes);

    if (await this.repo.hasOverlap(existing.staffId, start, end, id)) {
      throw new ConflictException('Staff member is already booked in this slot');
    }
    const updated = await this.repo.update(id, { startAt: start, endAt: end });
    return this.toView(updated);
  }

  /** Status transition (CONFIRM / COMPLETE / CANCEL). */
  async setStatus(salonId: string, id: string, status: BookingStatus) {
    await this.findOne(salonId, id);
    const updated = await this.repo.update(id, { status });
    return this.toView(updated);
  }

  private toView(b: BookingWithRelations) {
    return {
      id: b.id,
      startAt: b.startAt,
      endAt: b.endAt,
      status: b.status,
      priceJod: filsToJod(b.priceFils),
      client: { id: b.client.id, name: b.client.fullName },
      staff: { id: b.staff.id, name: b.staff.fullName },
      service: { id: b.service.id, name: b.service.name, durationMinutes: b.service.durationMinutes },
    };
  }
}

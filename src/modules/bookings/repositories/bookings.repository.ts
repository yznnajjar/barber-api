import { Injectable } from '@nestjs/common';
import { Booking, BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: { client: true; staff: true; service: true };
}>;

export abstract class BookingsRepository {
  abstract findInRange(salonId: string, from: Date, to: Date): Promise<BookingWithRelations[]>;
  abstract findOne(salonId: string, id: string): Promise<BookingWithRelations | null>;
  abstract hasOverlap(staffId: string, start: Date, end: Date, ignoreId?: string): Promise<boolean>;
  abstract create(data: Prisma.BookingUncheckedCreateInput): Promise<BookingWithRelations>;
  abstract update(id: string, data: Prisma.BookingUpdateInput): Promise<BookingWithRelations>;
}

@Injectable()
export class PrismaBookingsRepository extends BookingsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private readonly include = { client: true, staff: true, service: true } as const;

  findInRange(salonId: string, from: Date, to: Date): Promise<BookingWithRelations[]> {
    return this.prisma.booking.findMany({
      where: { salonId, startAt: { gte: from, lt: to } },
      include: this.include,
      orderBy: { startAt: 'asc' },
    });
  }

  findOne(salonId: string, id: string): Promise<BookingWithRelations | null> {
    return this.prisma.booking.findFirst({ where: { id, salonId }, include: this.include });
  }

  /** True if the staff member already has a non-cancelled booking overlapping [start, end). */
  async hasOverlap(staffId: string, start: Date, end: Date, ignoreId?: string): Promise<boolean> {
    const clash = await this.prisma.booking.findFirst({
      where: {
        staffId,
        id: ignoreId ? { not: ignoreId } : undefined,
        status: { not: BookingStatus.CANCELLED },
        startAt: { lt: end },
        endAt: { gt: start },
      },
      select: { id: true },
    });
    return Boolean(clash);
  }

  create(data: Prisma.BookingUncheckedCreateInput): Promise<BookingWithRelations> {
    return this.prisma.booking.create({ data, include: this.include });
  }

  update(id: string, data: Prisma.BookingUpdateInput): Promise<BookingWithRelations> {
    return this.prisma.booking.update({ where: { id }, data, include: this.include });
  }
}

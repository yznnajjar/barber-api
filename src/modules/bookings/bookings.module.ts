import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsRepository, PrismaBookingsRepository } from './repositories/bookings.repository';

@Module({
  controllers: [BookingsController],
  providers: [
    BookingsService,
    { provide: BookingsRepository, useClass: PrismaBookingsRepository },
  ],
  exports: [BookingsService],
})
export class BookingsModule {}

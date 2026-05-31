import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingStatus, Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { SalonId } from '../../common/decorators/salon-id.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';

@ApiTags('bookings')
@Roles(Role.SALON_OWNER)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Calendar feed for a day or week' })
  calendar(@SalonId() salonId: string, @Query() query: QueryBookingsDto) {
    return this.bookings.calendar(salonId, query);
  }

  @Get(':id')
  findOne(@SalonId() salonId: string, @Param('id') id: string) {
    return this.bookings.findOne(salonId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an appointment' })
  create(@SalonId() salonId: string, @Body() dto: CreateBookingDto) {
    return this.bookings.create(salonId, dto);
  }

  @Patch(':id/reschedule')
  reschedule(@SalonId() salonId: string, @Param('id') id: string, @Body() dto: RescheduleBookingDto) {
    return this.bookings.reschedule(salonId, id, dto);
  }

  @Patch(':id/confirm')
  confirm(@SalonId() salonId: string, @Param('id') id: string) {
    return this.bookings.setStatus(salonId, id, BookingStatus.CONFIRMED);
  }

  @Patch(':id/complete')
  complete(@SalonId() salonId: string, @Param('id') id: string) {
    return this.bookings.setStatus(salonId, id, BookingStatus.COMPLETED);
  }

  @Patch(':id/cancel')
  cancel(@SalonId() salonId: string, @Param('id') id: string) {
    return this.bookings.setStatus(salonId, id, BookingStatus.CANCELLED);
  }
}

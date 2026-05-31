import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RescheduleBookingDto {
  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  @IsDateString()
  startAt!: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum CalendarView {
  DAY = 'day',
  WEEK = 'week',
}

export class QueryBookingsDto {
  @ApiProperty({ example: '2026-06-01', description: 'Anchor date (YYYY-MM-DD)' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ enum: CalendarView, default: CalendarView.DAY })
  @IsOptional()
  @IsEnum(CalendarView)
  view: CalendarView = CalendarView.DAY;
}

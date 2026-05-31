import { ApiProperty } from '@nestjs/swagger';
import { Weekday } from '@prisma/client';
import { IsBoolean, IsEnum, IsString, Matches } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class WorkingHourDto {
  @ApiProperty({ enum: Weekday })
  @IsEnum(Weekday)
  weekday!: Weekday;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(HHMM, { message: 'startTime must be HH:mm' })
  startTime!: string;

  @ApiProperty({ example: '17:30' })
  @IsString()
  @Matches(HHMM, { message: 'endTime must be HH:mm' })
  endTime!: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  isOpen!: boolean;
}

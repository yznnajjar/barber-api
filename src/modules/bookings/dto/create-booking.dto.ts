import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty() @IsUUID() clientId!: string;
  @ApiProperty() @IsUUID() staffId!: string;
  @ApiProperty() @IsUUID() serviceId!: string;

  @ApiProperty({ example: '2026-06-01T10:00:00.000Z', description: 'ISO start time' })
  @IsDateString()
  @IsString()
  startAt!: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { WorkingHourDto } from './working-hour.dto';

export class CreateStaffDto {
  @ApiProperty({ example: 'Sami Hassan' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiPropertyOptional({ example: 'Senior Barber' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ type: [String], description: 'Service IDs this staff can perform' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];

  @ApiPropertyOptional({ type: [WorkingHourDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  workingHours?: WorkingHourDto[];
}

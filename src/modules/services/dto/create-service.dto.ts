import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Haircut' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'قص شعر' })
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @ApiProperty({ example: 5, description: 'Price in JOD (converted to fils internally)' })
  @IsInt()
  @Min(0)
  priceJod!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

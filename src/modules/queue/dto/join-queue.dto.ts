import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

/** A walk-in is either a saved client (clientId) or a guest (guestName). */
export class JoinQueueDto {
  @ApiPropertyOptional({ description: 'Existing client id (omit for a guest)' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Guest name (required if no clientId)' })
  @ValidateIf((o) => !o.clientId)
  @IsString()
  guestName?: string;

  @ApiProperty()
  @IsUUID()
  serviceId!: string;
}

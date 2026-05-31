import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
}

export class AuthResultDto extends AuthTokensDto {
  @ApiProperty() userId!: string;
  @ApiProperty() email!: string;
  @ApiProperty() role!: string;
  @ApiProperty({ nullable: true }) salonId!: string | null;
}

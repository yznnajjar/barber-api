import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { SalonId } from '../../common/decorators/salon-id.decorator';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { SalonsService } from './salons.service';

@ApiTags('salons')
@Roles(Role.SALON_OWNER)
@Controller('salon')
export class SalonsController {
  constructor(private readonly salons: SalonsService) {}

  @Get()
  @ApiOperation({ summary: "Get the current owner's salon profile" })
  profile(@SalonId() salonId: string) {
    return this.salons.getProfile(salonId);
  }

  @Patch()
  update(@SalonId() salonId: string, @Body() dto: UpdateSalonDto) {
    return this.salons.update(salonId, dto);
  }
}

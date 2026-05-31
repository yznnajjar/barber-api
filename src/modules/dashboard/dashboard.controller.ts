import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { SalonId } from '../../common/decorators/salon-id.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Roles(Role.SALON_OWNER)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Stat cards + upcoming appointments + recent activity' })
  overview(@SalonId() salonId: string) {
    return this.dashboard.overview(salonId);
  }
}

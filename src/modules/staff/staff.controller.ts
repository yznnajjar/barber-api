import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { SalonId } from '../../common/decorators/salon-id.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@Roles(Role.SALON_OWNER)
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'List staff with services + working hours' })
  findAll(@SalonId() salonId: string) {
    return this.staff.findAll(salonId);
  }

  @Get(':id')
  findOne(@SalonId() salonId: string, @Param('id') id: string) {
    return this.staff.findOne(salonId, id);
  }

  @Post()
  create(@SalonId() salonId: string, @Body() dto: CreateStaffDto) {
    return this.staff.create(salonId, dto);
  }

  @Patch(':id')
  update(@SalonId() salonId: string, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staff.update(salonId, id, dto);
  }
}

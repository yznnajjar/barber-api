import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SalonId } from '../../common/decorators/salon-id.decorator';
import { Role } from '@prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@Roles(Role.SALON_OWNER)
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all services for the salon' })
  findAll(@SalonId() salonId: string) {
    return this.services.findAll(salonId);
  }

  @Get(':id')
  findOne(@SalonId() salonId: string, @Param('id') id: string) {
    return this.services.findOne(salonId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a service' })
  create(@SalonId() salonId: string, @Body() dto: CreateServiceDto) {
    return this.services.create(salonId, dto);
  }

  @Patch(':id')
  update(@SalonId() salonId: string, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(salonId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@SalonId() salonId: string, @Param('id') id: string) {
    return this.services.remove(salonId, id);
  }
}

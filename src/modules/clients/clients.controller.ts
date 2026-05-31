import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { SalonId } from '../../common/decorators/salon-id.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('clients')
@Roles(Role.SALON_OWNER)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Search + paginate clients' })
  list(@SalonId() salonId: string, @Query() query: QueryClientsDto) {
    return this.clients.list(salonId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Full client profile with stats + history' })
  profile(@SalonId() salonId: string, @Param('id') id: string) {
    return this.clients.profile(salonId, id);
  }

  @Post()
  create(@SalonId() salonId: string, @Body() dto: CreateClientDto) {
    return this.clients.create(salonId, dto);
  }

  @Patch(':id')
  update(@SalonId() salonId: string, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clients.update(salonId, id, dto);
  }
}

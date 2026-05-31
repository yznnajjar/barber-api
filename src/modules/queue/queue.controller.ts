import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { SalonId } from '../../common/decorators/salon-id.decorator';
import { JoinQueueDto } from './dto/join-queue.dto';
import { QueueService } from './queue.service';

@ApiTags('queue')
@Roles(Role.SALON_OWNER)
@Controller('queue')
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  @Get()
  @ApiOperation({ summary: 'Current waiting list (initial load; Socket.io drives updates after)' })
  list(@SalonId() salonId: string) {
    return this.queue.list(salonId);
  }

  @Post('join')
  @ApiOperation({ summary: 'Add a walk-in to the queue' })
  join(@SalonId() salonId: string, @Body() dto: JoinQueueDto) {
    return this.queue.join(salonId, dto);
  }

  @Post('call-next')
  @ApiOperation({ summary: 'Call the next person in line' })
  callNext(@SalonId() salonId: string) {
    return this.queue.callNext(salonId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an entry from the queue' })
  cancel(@SalonId() salonId: string, @Param('id') id: string) {
    return this.queue.cancel(salonId, id);
  }
}

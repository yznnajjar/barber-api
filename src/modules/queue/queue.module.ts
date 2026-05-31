import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueGateway } from './queue.gateway';
import { QueueService } from './queue.service';
import { PrismaQueueRepository, QueueRepository } from './repositories/queue.repository';

@Module({
  controllers: [QueueController],
  providers: [
    QueueService,
    QueueGateway,
    { provide: QueueRepository, useClass: PrismaQueueRepository },
  ],
  exports: [QueueService],
})
export class QueueModule {}

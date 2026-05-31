import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QueueStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JoinQueueDto } from './dto/join-queue.dto';
import { QueueGateway } from './queue.gateway';
import { QueueEntryWithRelations, QueueRepository } from './repositories/queue.repository';

@Injectable()
export class QueueService {
  constructor(
    private readonly repo: QueueRepository,
    private readonly gateway: QueueGateway,
    private readonly prisma: PrismaService,
  ) {}

  /** Current waiting list, ordered by position. */
  async list(salonId: string) {
    const rows = await this.repo.listWaiting(salonId);
    return rows.map((r) => this.toView(r));
  }

  /** Add a walk-in to the back of the queue, then broadcast. */
  async join(salonId: string, dto: JoinQueueDto) {
    const service = await this.prisma.service.findFirst({ where: { id: dto.serviceId, salonId } });
    if (!service) throw new BadRequestException('Service does not belong to this salon');

    const position = await this.repo.nextPosition(salonId);
    // Rough ETA: people ahead * this service's duration.
    const estimatedWaitMin = (position - 1) * service.durationMinutes;

    await this.repo.add({
      salonId,
      clientId: dto.clientId ?? null,
      guestName: dto.clientId ? null : dto.guestName ?? 'Guest',
      serviceId: dto.serviceId,
      position,
      status: QueueStatus.WAITING,
      estimatedWaitMin,
    });

    return this.refreshAndBroadcast(salonId);
  }

  /** Pull the next person (lowest position) and mark them CALLED. */
  async callNext(salonId: string) {
    const head = await this.repo.head(salonId);
    if (!head) throw new NotFoundException('Queue is empty');

    await this.repo.setStatus(head.id, QueueStatus.CALLED, new Date());
    const list = await this.refreshAndBroadcast(salonId);
    return { called: this.toView(head), queue: list };
  }

  async cancel(salonId: string, id: string) {
    await this.repo.setStatus(id, QueueStatus.CANCELLED);
    return this.refreshAndBroadcast(salonId);
  }

  // --- helpers -------------------------------------------------------------

  /** Single choke point: re-read the queue and push it to all subscribers. */
  private async refreshAndBroadcast(salonId: string) {
    const list = await this.list(salonId);
    this.gateway.broadcast(salonId, list);
    return list;
  }

  private toView(e: QueueEntryWithRelations) {
    return {
      id: e.id,
      position: e.position,
      name: e.client?.fullName ?? e.guestName,
      service: e.service.name,
      estimatedWaitMin: e.estimatedWaitMin,
      joinedAt: e.joinedAt,
      status: e.status,
    };
  }
}

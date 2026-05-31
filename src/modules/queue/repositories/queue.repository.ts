import { Injectable } from '@nestjs/common';
import { Prisma, QueueStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type QueueEntryWithRelations = Prisma.QueueEntryGetPayload<{
  include: { client: true; service: true };
}>;

export abstract class QueueRepository {
  abstract listWaiting(salonId: string): Promise<QueueEntryWithRelations[]>;
  abstract nextPosition(salonId: string): Promise<number>;
  abstract add(data: Prisma.QueueEntryUncheckedCreateInput): Promise<QueueEntryWithRelations>;
  abstract head(salonId: string): Promise<QueueEntryWithRelations | null>;
  abstract setStatus(id: string, status: QueueStatus, calledAt?: Date): Promise<void>;
}

@Injectable()
export class PrismaQueueRepository extends QueueRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private readonly include = { client: true, service: true } as const;

  listWaiting(salonId: string): Promise<QueueEntryWithRelations[]> {
    return this.prisma.queueEntry.findMany({
      where: { salonId, status: QueueStatus.WAITING },
      include: this.include,
      orderBy: { position: 'asc' },
    });
  }

  /** Next position = current max waiting position + 1 (1-based). */
  async nextPosition(salonId: string): Promise<number> {
    const last = await this.prisma.queueEntry.aggregate({
      where: { salonId, status: QueueStatus.WAITING },
      _max: { position: true },
    });
    return (last._max.position ?? 0) + 1;
  }

  add(data: Prisma.QueueEntryUncheckedCreateInput): Promise<QueueEntryWithRelations> {
    return this.prisma.queueEntry.create({ data, include: this.include });
  }

  head(salonId: string): Promise<QueueEntryWithRelations | null> {
    return this.prisma.queueEntry.findFirst({
      where: { salonId, status: QueueStatus.WAITING },
      include: this.include,
      orderBy: { position: 'asc' },
    });
  }

  async setStatus(id: string, status: QueueStatus, calledAt?: Date): Promise<void> {
    await this.prisma.queueEntry.update({ where: { id }, data: { status, calledAt } });
  }
}

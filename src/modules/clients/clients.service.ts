import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { filsToJod } from '../../common/dto/money.util';
import { Paginated } from '../../common/dto/pagination.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientsRepository } from './repositories/clients.repository';

@Injectable()
export class ClientsService {
  constructor(private readonly repo: ClientsRepository) {}

  async list(salonId: string, query: QueryClientsDto): Promise<Paginated<any>> {
    const { rows, total } = await this.repo.search(
      salonId,
      query.search,
      query.skip,
      query.limit,
    );
    // One grouped query for the whole page (no N+1).
    const statsById = await this.repo.statsFor(rows.map((c) => c.id));
    const items = rows.map((c) => {
      const s = statsById.get(c.id) ?? { visits: 0, spentFils: 0, last: null };
      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        totalVisits: s.visits,
        totalSpentJod: filsToJod(s.spentFils),
        lastVisitAt: s.last,
      };
    });
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  /** Full profile = client + aggregate stats + booking history. */
  async profile(salonId: string, id: string) {
    const client = await this.repo.findOne(salonId, id);
    if (!client) throw new NotFoundException('Client not found');

    const [stats, history] = await Promise.all([
      this.repo.stats(id),
      this.repo.history(id),
    ]);

    return {
      id: client.id,
      fullName: client.fullName,
      phone: client.phone,
      notes: client.notes,
      memberSince: client.createdAt,
      stats: {
        totalVisits: stats.visits,
        totalSpentJod: filsToJod(stats.spentFils),
        avgSpendJod: stats.visits ? filsToJod(stats.spentFils) / stats.visits : 0,
      },
      history: history.map((b: any) => ({
        id: b.id,
        date: b.startAt,
        service: b.service?.name,
        staff: b.staff?.fullName,
        amountJod: filsToJod(b.priceFils),
        status: b.status,
      })),
    };
  }

  async create(salonId: string, dto: CreateClientDto) {
    const existing = await this.repo.findByPhone(salonId, dto.phone);
    if (existing) throw new ConflictException('A client with this phone already exists');
    return this.repo.create(salonId, dto as any);
  }

  async update(salonId: string, id: string, dto: UpdateClientDto) {
    const client = await this.repo.findOne(salonId, id);
    if (!client) throw new NotFoundException('Client not found');
    return this.repo.update(id, dto);
  }
}

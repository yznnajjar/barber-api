import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@prisma/client';
import { filsToJod, jodToFils } from '../../common/dto/money.util';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesRepository } from './repositories/services.repository';

/** A service as exposed by the API — money in JOD, not fils. */
export interface ServiceView {
  id: string;
  name: string;
  nameAr: string | null;
  durationMinutes: number;
  priceJod: number;
  isActive: boolean;
}

@Injectable()
export class ServicesService {
  constructor(private readonly repo: ServicesRepository) {}

  async findAll(salonId: string): Promise<ServiceView[]> {
    const rows = await this.repo.findAll(salonId);
    return rows.map((r) => this.toView(r));
  }

  async findOne(salonId: string, id: string): Promise<ServiceView> {
    const row = await this.repo.findOne(salonId, id);
    if (!row) throw new NotFoundException('Service not found');
    return this.toView(row);
  }

  async create(salonId: string, dto: CreateServiceDto): Promise<ServiceView> {
    const created = await this.repo.create(salonId, {
      name: dto.name,
      nameAr: dto.nameAr,
      durationMinutes: dto.durationMinutes,
      priceFils: jodToFils(dto.priceJod),
      isActive: dto.isActive ?? true,
    } as any);
    return this.toView(created);
  }

  async update(salonId: string, id: string, dto: UpdateServiceDto): Promise<ServiceView> {
    await this.findOne(salonId, id); // ownership + existence check
    const updated = await this.repo.update(id, {
      name: dto.name,
      nameAr: dto.nameAr,
      durationMinutes: dto.durationMinutes,
      priceFils: dto.priceJod !== undefined ? jodToFils(dto.priceJod) : undefined,
      isActive: dto.isActive,
    });
    return this.toView(updated);
  }

  async remove(salonId: string, id: string): Promise<void> {
    await this.findOne(salonId, id);
    await this.repo.remove(id);
  }

  /** Maps the DB row (fils) to the API shape (JOD). Single place for the conversion. */
  private toView(s: Service): ServiceView {
    return {
      id: s.id,
      name: s.name,
      nameAr: s.nameAr,
      durationMinutes: s.durationMinutes,
      priceJod: filsToJod(s.priceFils),
      isActive: s.isActive,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffRepository, StaffWithRelations } from './repositories/staff.repository';

@Injectable()
export class StaffService {
  constructor(private readonly repo: StaffRepository) {}

  async findAll(salonId: string) {
    const rows = await this.repo.findAll(salonId);
    return rows.map((r) => this.toView(r));
  }

  async findOne(salonId: string, id: string) {
    const row = await this.repo.findOne(salonId, id);
    if (!row) throw new NotFoundException('Staff member not found');
    return this.toView(row);
  }

  async create(salonId: string, dto: CreateStaffDto) {
    const created = await this.repo.create(
      salonId,
      { fullName: dto.fullName, role: dto.role },
      dto.serviceIds ?? [],
      dto.workingHours ?? [],
    );
    return this.toView(created);
  }

  async update(salonId: string, id: string, dto: UpdateStaffDto) {
    await this.findOne(salonId, id);
    const updated = await this.repo.update(
      id,
      { fullName: dto.fullName, role: dto.role },
      dto.serviceIds,
      dto.workingHours,
    );
    return this.toView(updated);
  }

  private toView(s: StaffWithRelations) {
    return {
      id: s.id,
      fullName: s.fullName,
      role: s.role,
      avatarUrl: s.avatarUrl,
      isActive: s.isActive,
      services: s.staffServices.map((ss) => ({ id: ss.service.id, name: ss.service.name })),
      workingHours: s.workingHours.map((w) => ({
        weekday: w.weekday,
        startTime: w.startTime,
        endTime: w.endTime,
        isOpen: w.isOpen,
      })),
    };
  }
}

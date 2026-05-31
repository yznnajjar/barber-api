import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSalonDto } from './dto/update-salon.dto';

/**
 * Salon profile is a single record per owner, so this small service talks to
 * Prisma directly rather than introducing a one-method repository.
 */
@Injectable()
export class SalonsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(salonId: string) {
    const salon = await this.prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) throw new NotFoundException('Salon not found');
    return salon;
  }

  update(salonId: string, dto: UpdateSalonDto) {
    return this.prisma.salon.update({ where: { id: salonId }, data: dto });
  }
}

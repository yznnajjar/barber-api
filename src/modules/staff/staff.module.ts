import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { PrismaStaffRepository, StaffRepository } from './repositories/staff.repository';

@Module({
  controllers: [StaffController],
  providers: [
    StaffService,
    { provide: StaffRepository, useClass: PrismaStaffRepository },
  ],
  exports: [StaffService],
})
export class StaffModule {}

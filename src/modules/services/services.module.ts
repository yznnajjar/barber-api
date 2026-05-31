import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { PrismaServicesRepository, ServicesRepository } from './repositories/services.repository';

@Module({
  controllers: [ServicesController],
  providers: [
    ServicesService,
    { provide: ServicesRepository, useClass: PrismaServicesRepository },
  ],
  exports: [ServicesService],
})
export class ServicesModule {}

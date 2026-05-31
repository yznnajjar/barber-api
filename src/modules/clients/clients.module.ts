import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientsRepository, PrismaClientsRepository } from './repositories/clients.repository';

@Module({
  controllers: [ClientsController],
  providers: [
    ClientsService,
    { provide: ClientsRepository, useClass: PrismaClientsRepository },
  ],
  exports: [ClientsService],
})
export class ClientsModule {}

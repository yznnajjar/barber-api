import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ServicesService } from '../src/modules/services/services.service';
import { ServicesRepository } from '../src/modules/services/repositories/services.repository';

/**
 * Because ServicesService depends on the abstract ServicesRepository (not
 * Prisma), we inject a plain in-memory mock here. No database, no Nest HTTP
 * layer — just the business logic. This is the payoff of dependency inversion.
 */
describe('ServicesService', () => {
  let service: ServicesService;
  let repo: jest.Mocked<ServicesRepository>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<ServicesRepository>> = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: ServicesRepository, useValue: repoMock },
      ],
    }).compile();

    service = moduleRef.get(ServicesService);
    repo = moduleRef.get(ServicesRepository);
  });

  it('converts price from fils to JOD on read', async () => {
    repo.findAll.mockResolvedValue([
      { id: '1', name: 'Haircut', nameAr: null, durationMinutes: 30, priceFils: 5000, isActive: true } as any,
    ]);

    const result = await service.findAll('salon-1');

    expect(result[0].priceJod).toBe(5); // 5000 fils -> 5 JOD
    expect(repo.findAll).toHaveBeenCalledWith('salon-1');
  });

  it('throws NotFound when a service is missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('salon-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('converts JOD to fils on create', async () => {
    repo.create.mockImplementation(async (_salonId, data: any) => ({
      id: '2', nameAr: null, isActive: true, ...data,
    }));

    await service.create('salon-1', {
      name: 'Beard Trim',
      durationMinutes: 20,
      priceJod: 3,
    });

    expect(repo.create).toHaveBeenCalledWith(
      'salon-1',
      expect.objectContaining({ priceFils: 3000 }),
    );
  });
});

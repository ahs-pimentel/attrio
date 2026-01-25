import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitEntity } from './unit.entity';
import { UnitStatus } from '@attrio/contracts';

describe('UnitsService', () => {
  let service: UnitsService;
  let repository: jest.Mocked<Repository<UnitEntity>>;

  const mockTenantId = 'tenant-123';

  const createMockUnit = (overrides: Partial<UnitEntity> = {}): Partial<UnitEntity> => ({
    id: 'unit-1',
    tenantId: mockTenantId,
    block: 'A',
    number: '101',
    identifier: 'A-101',
    status: UnitStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        {
          provide: getRepositoryToken(UnitEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
    repository = module.get(getRepositoryToken(UnitEntity));

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('findAllByTenant', () => {
    it('should return all units for a tenant', async () => {
      const mockUnit = createMockUnit();
      const units = [mockUnit, createMockUnit({ id: 'unit-2', number: '102', identifier: 'A-102' })];
      mockRepository.find.mockResolvedValue(units as UnitEntity[]);

      const result = await service.findAllByTenant(mockTenantId);

      expect(result).toEqual(units);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        order: { block: 'ASC', number: 'ASC' },
      });
    });

    it('should return empty array when no units exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAllByTenant(mockTenantId);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a unit when found', async () => {
      const mockUnit = createMockUnit();
      mockRepository.findOne.mockResolvedValue(mockUnit as UnitEntity);

      const result = await service.findById('unit-1', mockTenantId);

      expect(result).toEqual(mockUnit);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'unit-1', tenantId: mockTenantId },
      });
    });

    it('should throw NotFoundException when unit not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByIdentifier', () => {
    it('should return a unit when found by identifier', async () => {
      const mockUnit = createMockUnit();
      mockRepository.findOne.mockResolvedValue(mockUnit as UnitEntity);

      const result = await service.findByIdentifier('A-101', mockTenantId);

      expect(result).toEqual(mockUnit);
    });

    it('should return null when not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByIdentifier('B-999', mockTenantId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a unit with generated identifier', async () => {
      const mockUnit = createMockUnit();
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUnit as UnitEntity);
      mockRepository.save.mockResolvedValue(mockUnit as UnitEntity);

      const result = await service.create(mockTenantId, {
        block: 'A',
        number: '101',
      });

      expect(result).toEqual(mockUnit);
      expect(mockRepository.create).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        block: 'A',
        number: '101',
        identifier: 'A-101',
      });
    });

    it('should create a unit with custom identifier', async () => {
      const customIdentifier = 'APTO-101';
      const mockUnit = createMockUnit({ identifier: customIdentifier });
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUnit as UnitEntity);
      mockRepository.save.mockResolvedValue(mockUnit as UnitEntity);

      const result = await service.create(mockTenantId, {
        block: 'A',
        number: '101',
        identifier: customIdentifier,
      });

      expect(result.identifier).toBe(customIdentifier);
    });

    it('should throw ConflictException when identifier already exists', async () => {
      const mockUnit = createMockUnit();
      mockRepository.findOne.mockResolvedValue(mockUnit as UnitEntity);

      await expect(
        service.create(mockTenantId, {
          block: 'A',
          number: '101',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a unit', async () => {
      const mockUnit = createMockUnit();
      const updatedUnit = createMockUnit({ number: '102', identifier: 'A-102' });
      mockRepository.findOne
        .mockResolvedValueOnce(mockUnit as UnitEntity) // findById
        .mockResolvedValueOnce(null); // findByIdentifier (no conflict)
      mockRepository.save.mockResolvedValue(updatedUnit as UnitEntity);

      const result = await service.update('unit-1', mockTenantId, {
        number: '102',
      });

      expect(result.number).toBe('102');
    });

    it('should throw NotFoundException when unit not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', mockTenantId, { number: '102' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when new identifier already exists', async () => {
      const mockUnit = createMockUnit();
      const existingUnit = createMockUnit({ id: 'unit-2', identifier: 'A-102' });
      mockRepository.findOne
        .mockResolvedValueOnce(mockUnit as UnitEntity) // findById
        .mockResolvedValueOnce(existingUnit as UnitEntity); // findByIdentifier (conflict)

      await expect(
        service.update('unit-1', mockTenantId, { identifier: 'A-102' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete a unit', async () => {
      const mockUnit = createMockUnit();
      mockRepository.findOne.mockResolvedValue(mockUnit as UnitEntity);
      mockRepository.remove.mockResolvedValue(mockUnit as UnitEntity);

      await service.delete('unit-1', mockTenantId);

      expect(mockRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when unit not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate a unit', async () => {
      const mockUnit = createMockUnit();
      const deactivatedUnit = createMockUnit({ status: UnitStatus.INACTIVE });
      mockRepository.findOne.mockResolvedValue(mockUnit as UnitEntity);
      mockRepository.save.mockResolvedValue(deactivatedUnit as UnitEntity);

      const result = await service.deactivate('unit-1', mockTenantId);

      expect(result.status).toBe(UnitStatus.INACTIVE);
    });
  });

  describe('activate', () => {
    it('should activate a unit', async () => {
      const inactiveUnit = createMockUnit({ status: UnitStatus.INACTIVE });
      const activatedUnit = createMockUnit({ status: UnitStatus.ACTIVE });
      mockRepository.findOne.mockResolvedValue(inactiveUnit as UnitEntity);
      mockRepository.save.mockResolvedValue(activatedUnit as UnitEntity);

      const result = await service.activate('unit-1', mockTenantId);

      expect(result.status).toBe(UnitStatus.ACTIVE);
    });
  });

  describe('countByTenant', () => {
    it('should return count of units for tenant', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.countByTenant(mockTenantId);

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { UnitStatus, UserRole } from '@attrio/contracts';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UnitsController', () => {
  let controller: UnitsController;
  let service: jest.Mocked<UnitsService>;

  const mockTenantId = 'tenant-123';
  const mockUser = { tenantId: mockTenantId, role: UserRole.SYNDIC };

  const mockUnit = {
    id: 'unit-1',
    tenantId: mockTenantId,
    block: 'A',
    number: '101',
    identifier: 'A-101',
    status: UnitStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    findAllByTenant: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deactivate: jest.fn(),
    activate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
      providers: [
        {
          provide: UnitsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UnitsController>(UnitsController);
    service = module.get(UnitsService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all units for the tenant', async () => {
      const units = [mockUnit, { ...mockUnit, id: 'unit-2' }];
      mockService.findAllByTenant.mockResolvedValue(units);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(units);
      expect(mockService.findAllByTenant).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('findById', () => {
    it('should return a unit by id', async () => {
      mockService.findById.mockResolvedValue(mockUnit);

      const result = await controller.findById('unit-1', mockUser);

      expect(result).toEqual(mockUnit);
      expect(mockService.findById).toHaveBeenCalledWith('unit-1', mockTenantId);
    });

    it('should propagate NotFoundException', async () => {
      mockService.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findById('non-existent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new unit', async () => {
      const createDto = { block: 'A', number: '101' };
      mockService.create.mockResolvedValue(mockUnit);

      const result = await controller.create(createDto, mockUser);

      expect(result).toEqual(mockUnit);
      expect(mockService.create).toHaveBeenCalledWith(mockTenantId, createDto);
    });

    it('should propagate ConflictException', async () => {
      const createDto = { block: 'A', number: '101' };
      mockService.create.mockRejectedValue(new ConflictException());

      await expect(controller.create(createDto, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update a unit', async () => {
      const updateDto = { number: '102' };
      const updatedUnit = { ...mockUnit, number: '102' };
      mockService.update.mockResolvedValue(updatedUnit);

      const result = await controller.update('unit-1', updateDto, mockUser);

      expect(result.number).toBe('102');
      expect(mockService.update).toHaveBeenCalledWith('unit-1', mockTenantId, updateDto);
    });
  });

  describe('delete', () => {
    it('should delete a unit', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await controller.delete('unit-1', mockUser);

      expect(mockService.delete).toHaveBeenCalledWith('unit-1', mockTenantId);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a unit', async () => {
      const deactivatedUnit = { ...mockUnit, status: UnitStatus.INACTIVE };
      mockService.deactivate.mockResolvedValue(deactivatedUnit);

      const result = await controller.deactivate('unit-1', mockUser);

      expect(result.status).toBe(UnitStatus.INACTIVE);
      expect(mockService.deactivate).toHaveBeenCalledWith('unit-1', mockTenantId);
    });
  });

  describe('activate', () => {
    it('should activate a unit', async () => {
      mockService.activate.mockResolvedValue(mockUnit);

      const result = await controller.activate('unit-1', mockUser);

      expect(result.status).toBe(UnitStatus.ACTIVE);
      expect(mockService.activate).toHaveBeenCalledWith('unit-1', mockTenantId);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import {
  ResidentEntity,
  ResidentContactEntity,
  HouseholdMemberEntity,
  UnitEmployeeEntity,
  VehicleEntity,
  PetEntity,
} from './entities';
import { ResidentStatus, ResidentType, RelationshipType, PetType } from '@attrio/contracts';

describe('ResidentsService', () => {
  let service: ResidentsService;
  let residentRepository: jest.Mocked<Repository<ResidentEntity>>;

  const mockTenantId = 'tenant-123';

  const mockResident: Partial<ResidentEntity> = {
    id: 'resident-1',
    tenantId: mockTenantId,
    unitId: 'unit-1',
    type: ResidentType.OWNER,
    fullName: 'John Doe',
    email: 'john@example.com',
    status: ResidentStatus.ACTIVE,
    dataConsent: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockResidentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockContactRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockMemberRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockEmployeeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockVehicleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockPetRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResidentsService,
        { provide: getRepositoryToken(ResidentEntity), useValue: mockResidentRepository },
        { provide: getRepositoryToken(ResidentContactEntity), useValue: mockContactRepository },
        { provide: getRepositoryToken(HouseholdMemberEntity), useValue: mockMemberRepository },
        { provide: getRepositoryToken(UnitEmployeeEntity), useValue: mockEmployeeRepository },
        { provide: getRepositoryToken(VehicleEntity), useValue: mockVehicleRepository },
        { provide: getRepositoryToken(PetEntity), useValue: mockPetRepository },
      ],
    }).compile();

    service = module.get<ResidentsService>(ResidentsService);
    residentRepository = module.get(getRepositoryToken(ResidentEntity));

    jest.clearAllMocks();
  });

  describe('findAllByTenant', () => {
    it('should return all residents for a tenant', async () => {
      const residents = [mockResident, { ...mockResident, id: 'resident-2', fullName: 'Jane Doe' }];
      mockResidentRepository.find.mockResolvedValue(residents as ResidentEntity[]);

      const result = await service.findAllByTenant(mockTenantId);

      expect(result).toEqual(residents);
      expect(mockResidentRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        relations: ['unit', 'emergencyContacts', 'householdMembers', 'employees', 'vehicles', 'pets'],
        order: { fullName: 'ASC' },
      });
    });
  });

  describe('findById', () => {
    it('should return a resident when found', async () => {
      mockResidentRepository.findOne.mockResolvedValue(mockResident as ResidentEntity);

      const result = await service.findById('resident-1', mockTenantId);

      expect(result).toEqual(mockResident);
    });

    it('should throw NotFoundException when resident not found', async () => {
      mockResidentRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUnit', () => {
    it('should return residents for a unit', async () => {
      const residents = [mockResident];
      mockResidentRepository.find.mockResolvedValue(residents as ResidentEntity[]);

      const result = await service.findByUnit('unit-1', mockTenantId);

      expect(result).toEqual(residents);
      expect(mockResidentRepository.find).toHaveBeenCalledWith({
        where: { unitId: 'unit-1', tenantId: mockTenantId },
        relations: ['emergencyContacts', 'householdMembers', 'employees', 'vehicles', 'pets'],
        order: { fullName: 'ASC' },
      });
    });
  });

  describe('findByUserId', () => {
    it('should return a resident by userId', async () => {
      mockResidentRepository.findOne.mockResolvedValue(mockResident as ResidentEntity);

      const result = await service.findByUserId('user-123');

      expect(result).toEqual(mockResident);
      expect(mockResidentRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        relations: ['unit', 'tenant'],
      });
    });

    it('should return null when not found', async () => {
      mockResidentRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUserId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a resident', async () => {
      const updatedResident = { ...mockResident, fullName: 'John Updated' };
      mockResidentRepository.findOne.mockResolvedValue(mockResident as ResidentEntity);
      mockResidentRepository.save.mockResolvedValue(updatedResident as ResidentEntity);

      const result = await service.update('resident-1', mockTenantId, { fullName: 'John Updated' });

      expect(result.fullName).toBe('John Updated');
    });
  });

  describe('delete', () => {
    it('should delete a resident', async () => {
      mockResidentRepository.findOne.mockResolvedValue(mockResident as ResidentEntity);
      mockResidentRepository.remove.mockResolvedValue(mockResident as ResidentEntity);

      await service.delete('resident-1', mockTenantId);

      expect(mockResidentRepository.remove).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should deactivate a resident', async () => {
      const deactivatedResident = { ...mockResident, status: ResidentStatus.INACTIVE };
      mockResidentRepository.findOne.mockResolvedValue(mockResident as ResidentEntity);
      mockResidentRepository.save.mockResolvedValue(deactivatedResident as ResidentEntity);

      const result = await service.deactivate('resident-1', mockTenantId);

      expect(result.status).toBe(ResidentStatus.INACTIVE);
    });
  });

  describe('activate', () => {
    it('should activate a resident', async () => {
      const inactiveResident = { ...mockResident, status: ResidentStatus.INACTIVE };
      const activatedResident = { ...mockResident, status: ResidentStatus.ACTIVE };
      mockResidentRepository.findOne.mockResolvedValue(inactiveResident as ResidentEntity);
      mockResidentRepository.save.mockResolvedValue(activatedResident as ResidentEntity);

      const result = await service.activate('resident-1', mockTenantId);

      expect(result.status).toBe(ResidentStatus.ACTIVE);
    });
  });

  describe('addEmergencyContact', () => {
    it('should add an emergency contact', async () => {
      const contactData = { name: 'Contact Name', phone: '123456789', isWhatsApp: true };
      const mockContact = { id: 'contact-1', residentId: 'resident-1', ...contactData };
      mockContactRepository.create.mockReturnValue(mockContact);
      mockContactRepository.save.mockResolvedValue(mockContact);

      const result = await service.addEmergencyContact('resident-1', contactData);

      expect(result).toEqual(mockContact);
      expect(mockContactRepository.create).toHaveBeenCalledWith({
        residentId: 'resident-1',
        ...contactData,
      });
    });
  });

  describe('addHouseholdMember', () => {
    it('should add a household member', async () => {
      const memberData = { name: 'Family Member', relationship: RelationshipType.SPOUSE };
      const mockMember = { id: 'member-1', residentId: 'resident-1', ...memberData };
      mockMemberRepository.create.mockReturnValue(mockMember);
      mockMemberRepository.save.mockResolvedValue(mockMember);

      const result = await service.addHouseholdMember('resident-1', memberData);

      expect(result).toEqual(mockMember);
    });
  });

  describe('addVehicle', () => {
    it('should add a vehicle', async () => {
      const vehicleData = { brand: 'Toyota', model: 'Corolla', color: 'White', plate: 'ABC1234' };
      const mockVehicle = { id: 'vehicle-1', residentId: 'resident-1', ...vehicleData };
      mockVehicleRepository.create.mockReturnValue(mockVehicle);
      mockVehicleRepository.save.mockResolvedValue(mockVehicle);

      const result = await service.addVehicle('resident-1', vehicleData);

      expect(result).toEqual(mockVehicle);
    });
  });

  describe('addPet', () => {
    it('should add a pet', async () => {
      const petData = { name: 'Max', type: PetType.DOG, breed: 'Labrador' };
      const mockPet = { id: 'pet-1', residentId: 'resident-1', ...petData };
      mockPetRepository.create.mockReturnValue(mockPet);
      mockPetRepository.save.mockResolvedValue(mockPet);

      const result = await service.addPet('resident-1', petData);

      expect(result).toEqual(mockPet);
    });
  });
});

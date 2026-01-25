import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AssembliesService } from './assemblies.service';
import { AssemblyEntity, AgendaItemEntity, AssemblyParticipantEntity } from './entities';
import { AssemblyStatus, AgendaItemStatus } from '@attrio/contracts';

describe('AssembliesService', () => {
  let service: AssembliesService;
  let assemblyRepository: jest.Mocked<Repository<AssemblyEntity>>;
  let agendaItemRepository: jest.Mocked<Repository<AgendaItemEntity>>;
  let participantRepository: jest.Mocked<Repository<AssemblyParticipantEntity>>;

  const mockTenantId = 'tenant-123';

  const mockAssembly: Partial<AssemblyEntity> = {
    id: 'assembly-1',
    tenantId: mockTenantId,
    title: 'Assembleia Ordinaria',
    description: 'Assembleia mensal',
    scheduledAt: new Date('2024-03-01T19:00:00'),
    status: AssemblyStatus.SCHEDULED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAssemblyRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAgendaItemRepository = {
    count: jest.fn(),
  };

  const mockParticipantRepository = {
    count: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssembliesService,
        { provide: getRepositoryToken(AssemblyEntity), useValue: mockAssemblyRepository },
        { provide: getRepositoryToken(AgendaItemEntity), useValue: mockAgendaItemRepository },
        { provide: getRepositoryToken(AssemblyParticipantEntity), useValue: mockParticipantRepository },
      ],
    }).compile();

    service = module.get<AssembliesService>(AssembliesService);
    assemblyRepository = module.get(getRepositoryToken(AssemblyEntity));
    agendaItemRepository = module.get(getRepositoryToken(AgendaItemEntity));
    participantRepository = module.get(getRepositoryToken(AssemblyParticipantEntity));

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all assemblies for a tenant', async () => {
      const assemblies = [mockAssembly];
      mockAssemblyRepository.find.mockResolvedValue(assemblies as AssemblyEntity[]);

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual(assemblies);
      expect(mockAssemblyRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        order: { scheduledAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return an assembly when found', async () => {
      mockAssemblyRepository.findOne.mockResolvedValue(mockAssembly as AssemblyEntity);

      const result = await service.findById('assembly-1', mockTenantId);

      expect(result).toEqual(mockAssembly);
    });

    it('should throw NotFoundException when assembly not found', async () => {
      mockAssemblyRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findUpcoming', () => {
    it('should return upcoming assemblies', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAssembly]),
      };
      mockAssemblyRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findUpcoming(mockTenantId);

      expect(result).toEqual([mockAssembly]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('assembly.tenantId = :tenantId', {
        tenantId: mockTenantId,
      });
    });
  });

  describe('create', () => {
    it('should create a new assembly', async () => {
      const createDto = {
        title: 'Nova Assembleia',
        description: 'Descricao',
        scheduledAt: '2024-03-01T19:00:00',
      };
      const createdAssembly = {
        ...mockAssembly,
        title: createDto.title,
        description: createDto.description,
        scheduledAt: new Date(createDto.scheduledAt),
      };
      mockAssemblyRepository.create.mockReturnValue(createdAssembly as AssemblyEntity);
      mockAssemblyRepository.save.mockResolvedValue(createdAssembly as AssemblyEntity);

      const result = await service.create(mockTenantId, createDto);

      expect(result.title).toBe('Nova Assembleia');
      expect(mockAssemblyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
          title: createDto.title,
          status: AssemblyStatus.SCHEDULED,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update an assembly', async () => {
      const updatedAssembly = { ...mockAssembly, title: 'Titulo Atualizado' };
      mockAssemblyRepository.findOne.mockResolvedValue(mockAssembly as AssemblyEntity);
      mockAssemblyRepository.save.mockResolvedValue(updatedAssembly as AssemblyEntity);

      const result = await service.update('assembly-1', mockTenantId, {
        title: 'Titulo Atualizado',
      });

      expect(result.title).toBe('Titulo Atualizado');
    });
  });

  describe('delete', () => {
    it('should delete an assembly', async () => {
      mockAssemblyRepository.findOne.mockResolvedValue(mockAssembly as AssemblyEntity);
      mockAssemblyRepository.remove.mockResolvedValue(mockAssembly as AssemblyEntity);

      await service.delete('assembly-1', mockTenantId);

      expect(mockAssemblyRepository.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to delete in-progress assembly', async () => {
      const inProgressAssembly = { ...mockAssembly, status: AssemblyStatus.IN_PROGRESS };
      mockAssemblyRepository.findOne.mockResolvedValue(inProgressAssembly as AssemblyEntity);

      await expect(service.delete('assembly-1', mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('start', () => {
    it('should start a scheduled assembly', async () => {
      const startedAssembly = {
        ...mockAssembly,
        status: AssemblyStatus.IN_PROGRESS,
        startedAt: new Date(),
      };
      mockAssemblyRepository.findOne.mockResolvedValue(mockAssembly as AssemblyEntity);
      mockAssemblyRepository.save.mockResolvedValue(startedAssembly as AssemblyEntity);

      const result = await service.start('assembly-1', mockTenantId);

      expect(result.status).toBe(AssemblyStatus.IN_PROGRESS);
      expect(result.startedAt).toBeDefined();
    });

    it('should throw BadRequestException when assembly is not scheduled', async () => {
      const inProgressAssembly = { ...mockAssembly, status: AssemblyStatus.IN_PROGRESS };
      mockAssemblyRepository.findOne.mockResolvedValue(inProgressAssembly as AssemblyEntity);

      await expect(service.start('assembly-1', mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('finish', () => {
    it('should finish an in-progress assembly', async () => {
      const inProgressAssembly = { ...mockAssembly, status: AssemblyStatus.IN_PROGRESS };
      const finishedAssembly = {
        ...mockAssembly,
        status: AssemblyStatus.FINISHED,
        finishedAt: new Date(),
      };
      mockAssemblyRepository.findOne.mockResolvedValue(inProgressAssembly as AssemblyEntity);
      mockAgendaItemRepository.count.mockResolvedValue(0); // No open agenda items
      mockAssemblyRepository.save.mockResolvedValue(finishedAssembly as AssemblyEntity);

      const result = await service.finish('assembly-1', mockTenantId);

      expect(result.status).toBe(AssemblyStatus.FINISHED);
    });

    it('should throw BadRequestException when there are open voting items', async () => {
      const inProgressAssembly = { ...mockAssembly, status: AssemblyStatus.IN_PROGRESS };
      mockAssemblyRepository.findOne.mockResolvedValue(inProgressAssembly as AssemblyEntity);
      mockAgendaItemRepository.count.mockResolvedValue(1); // Has open agenda items

      await expect(service.finish('assembly-1', mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when assembly is not in progress', async () => {
      mockAssemblyRepository.findOne.mockResolvedValue(mockAssembly as AssemblyEntity);

      await expect(service.finish('assembly-1', mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a scheduled assembly', async () => {
      const cancelledAssembly = { ...mockAssembly, status: AssemblyStatus.CANCELLED };
      mockAssemblyRepository.findOne.mockResolvedValue(mockAssembly as AssemblyEntity);
      mockAssemblyRepository.save.mockResolvedValue(cancelledAssembly as AssemblyEntity);

      const result = await service.cancel('assembly-1', mockTenantId);

      expect(result.status).toBe(AssemblyStatus.CANCELLED);
    });

    it('should throw BadRequestException when trying to cancel finished assembly', async () => {
      const finishedAssembly = { ...mockAssembly, status: AssemblyStatus.FINISHED };
      mockAssemblyRepository.findOne.mockResolvedValue(finishedAssembly as AssemblyEntity);

      await expect(service.cancel('assembly-1', mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStats', () => {
    it('should return assembly statistics', async () => {
      mockAssemblyRepository.findOne.mockResolvedValue(mockAssembly as AssemblyEntity);
      mockParticipantRepository.count.mockResolvedValue(10);
      mockAgendaItemRepository.count
        .mockResolvedValueOnce(5) // agendaItemsCount
        .mockResolvedValueOnce(3); // votedItemsCount
      mockParticipantRepository.find.mockResolvedValue([
        { votingWeight: 1 },
        { votingWeight: 2 },
        { votingWeight: 1 },
      ] as any);

      const result = await service.getStats('assembly-1', mockTenantId);

      expect(result).toEqual({
        participantsCount: 10,
        agendaItemsCount: 5,
        votedItemsCount: 3,
        totalVotingWeight: 4,
      });
    });
  });
});

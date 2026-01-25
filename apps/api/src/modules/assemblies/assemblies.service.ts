import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssemblyEntity, AgendaItemEntity, AssemblyParticipantEntity } from './entities';
import { CreateAssemblyDto, UpdateAssemblyDto } from './dto';
import { AssemblyStatus, AgendaItemStatus } from '@attrio/contracts';

@Injectable()
export class AssembliesService {
  constructor(
    @InjectRepository(AssemblyEntity)
    private readonly assemblyRepository: Repository<AssemblyEntity>,
    @InjectRepository(AgendaItemEntity)
    private readonly agendaItemRepository: Repository<AgendaItemEntity>,
    @InjectRepository(AssemblyParticipantEntity)
    private readonly participantRepository: Repository<AssemblyParticipantEntity>,
  ) {}

  async findAll(tenantId: string): Promise<AssemblyEntity[]> {
    return this.assemblyRepository.find({
      where: { tenantId },
      order: { scheduledAt: 'DESC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<AssemblyEntity> {
    const assembly = await this.assemblyRepository.findOne({
      where: { id, tenantId },
      relations: ['agendaItems', 'participants', 'participants.unit', 'participants.resident'],
    });
    if (!assembly) {
      throw new NotFoundException(`Assembleia com ID ${id} nao encontrada`);
    }
    return assembly;
  }

  async findUpcoming(tenantId: string): Promise<AssemblyEntity[]> {
    return this.assemblyRepository
      .createQueryBuilder('assembly')
      .where('assembly.tenantId = :tenantId', { tenantId })
      .andWhere('assembly.status IN (:...statuses)', {
        statuses: [AssemblyStatus.SCHEDULED, AssemblyStatus.IN_PROGRESS],
      })
      .andWhere('assembly.scheduledAt >= :now', { now: new Date() })
      .orderBy('assembly.scheduledAt', 'ASC')
      .getMany();
  }

  async create(tenantId: string, dto: CreateAssemblyDto): Promise<AssemblyEntity> {
    const assembly = this.assemblyRepository.create({
      tenantId,
      title: dto.title,
      description: dto.description,
      scheduledAt: new Date(dto.scheduledAt),
      meetingUrl: dto.meetingUrl,
      status: AssemblyStatus.SCHEDULED,
    });
    return this.assemblyRepository.save(assembly);
  }

  async update(id: string, tenantId: string, dto: UpdateAssemblyDto): Promise<AssemblyEntity> {
    const assembly = await this.findById(id, tenantId);

    if (dto.title !== undefined) assembly.title = dto.title;
    if (dto.description !== undefined) assembly.description = dto.description;
    if (dto.scheduledAt !== undefined) assembly.scheduledAt = new Date(dto.scheduledAt);
    if (dto.meetingUrl !== undefined) assembly.meetingUrl = dto.meetingUrl;
    if (dto.status !== undefined) assembly.status = dto.status;

    return this.assemblyRepository.save(assembly);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const assembly = await this.findById(id, tenantId);
    if (assembly.status === AssemblyStatus.IN_PROGRESS) {
      throw new BadRequestException('Nao e possivel excluir uma assembleia em andamento');
    }
    await this.assemblyRepository.remove(assembly);
  }

  async start(id: string, tenantId: string): Promise<AssemblyEntity> {
    const assembly = await this.findById(id, tenantId);

    if (assembly.status !== AssemblyStatus.SCHEDULED) {
      throw new BadRequestException('Somente assembleias agendadas podem ser iniciadas');
    }

    assembly.status = AssemblyStatus.IN_PROGRESS;
    assembly.startedAt = new Date();

    return this.assemblyRepository.save(assembly);
  }

  async finish(id: string, tenantId: string): Promise<AssemblyEntity> {
    const assembly = await this.findById(id, tenantId);

    if (assembly.status !== AssemblyStatus.IN_PROGRESS) {
      throw new BadRequestException('Somente assembleias em andamento podem ser finalizadas');
    }

    // Verificar se todas as pautas foram fechadas
    const openAgendaItems = await this.agendaItemRepository.count({
      where: {
        assemblyId: id,
        status: AgendaItemStatus.VOTING,
      },
    });

    if (openAgendaItems > 0) {
      throw new BadRequestException('Existem pautas com votacao em aberto');
    }

    assembly.status = AssemblyStatus.FINISHED;
    assembly.finishedAt = new Date();

    return this.assemblyRepository.save(assembly);
  }

  async cancel(id: string, tenantId: string): Promise<AssemblyEntity> {
    const assembly = await this.findById(id, tenantId);

    if (assembly.status === AssemblyStatus.FINISHED) {
      throw new BadRequestException('Nao e possivel cancelar uma assembleia ja finalizada');
    }

    assembly.status = AssemblyStatus.CANCELLED;

    return this.assemblyRepository.save(assembly);
  }

  async getStats(id: string, tenantId: string): Promise<{
    participantsCount: number;
    agendaItemsCount: number;
    votedItemsCount: number;
    totalVotingWeight: number;
  }> {
    await this.findById(id, tenantId); // Valida que existe

    const participantsCount = await this.participantRepository.count({
      where: { assemblyId: id },
    });

    const agendaItemsCount = await this.agendaItemRepository.count({
      where: { assemblyId: id },
    });

    const votedItemsCount = await this.agendaItemRepository.count({
      where: { assemblyId: id, status: AgendaItemStatus.CLOSED },
    });

    const participants = await this.participantRepository.find({
      where: { assemblyId: id },
      select: ['votingWeight'],
    });

    const totalVotingWeight = participants.reduce(
      (sum, p) => sum + Number(p.votingWeight),
      0,
    );

    return {
      participantsCount,
      agendaItemsCount,
      votedItemsCount,
      totalVotingWeight,
    };
  }
}

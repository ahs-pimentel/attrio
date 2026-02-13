import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgendaItemEntity, VoteEntity, AssemblyEntity } from './entities';
import { CreateAgendaItemDto, UpdateAgendaItemDto, VoteResultDto } from './dto';
import { AgendaItemStatus, AssemblyStatus, VoteChoice } from '@attrio/contracts';
import { OtpService } from './otp.service';

@Injectable()
export class AgendaItemsService {
  constructor(
    @InjectRepository(AgendaItemEntity)
    private readonly agendaItemRepository: Repository<AgendaItemEntity>,
    @InjectRepository(VoteEntity)
    private readonly voteRepository: Repository<VoteEntity>,
    @InjectRepository(AssemblyEntity)
    private readonly assemblyRepository: Repository<AssemblyEntity>,
    @Inject(forwardRef(() => OtpService))
    private readonly otpService: OtpService,
  ) {}

  async findByAssembly(assemblyId: string): Promise<AgendaItemEntity[]> {
    return this.agendaItemRepository.find({
      where: { assemblyId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: string): Promise<AgendaItemEntity> {
    const item = await this.agendaItemRepository.findOne({
      where: { id },
      relations: ['assembly', 'votes'],
    });
    if (!item) {
      throw new NotFoundException(`Pauta com ID ${id} nao encontrada`);
    }
    return item;
  }

  async create(assemblyId: string, tenantId: string, dto: CreateAgendaItemDto): Promise<AgendaItemEntity> {
    // Verificar se a assembleia existe e pertence ao tenant
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId, tenantId },
    });

    if (!assembly) {
      throw new NotFoundException(`Assembleia com ID ${assemblyId} nao encontrada`);
    }

    if (assembly.status !== AssemblyStatus.SCHEDULED) {
      throw new BadRequestException('So e possivel adicionar pautas em assembleias agendadas');
    }

    // Determinar a ordem
    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined) {
      const maxOrder = await this.agendaItemRepository
        .createQueryBuilder('item')
        .where('item.assemblyId = :assemblyId', { assemblyId })
        .select('MAX(item.orderIndex)', 'max')
        .getRawOne();
      orderIndex = (maxOrder?.max ?? -1) + 1;
    }

    const item = this.agendaItemRepository.create({
      assemblyId,
      title: dto.title,
      description: dto.description,
      orderIndex,
      requiresQuorum: dto.requiresQuorum ?? true,
      quorumType: dto.quorumType ?? 'simple',
      status: AgendaItemStatus.PENDING,
    });

    return this.agendaItemRepository.save(item);
  }

  async update(id: string, dto: UpdateAgendaItemDto): Promise<AgendaItemEntity> {
    const item = await this.findById(id);

    if (item.status === AgendaItemStatus.CLOSED && dto.status !== AgendaItemStatus.CLOSED) {
      throw new BadRequestException('Nao e possivel reabrir uma pauta ja fechada');
    }

    if (dto.title !== undefined) item.title = dto.title;
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.orderIndex !== undefined) item.orderIndex = dto.orderIndex;
    if (dto.requiresQuorum !== undefined) item.requiresQuorum = dto.requiresQuorum;
    if (dto.quorumType !== undefined) item.quorumType = dto.quorumType;
    if (dto.status !== undefined) item.status = dto.status;
    if (dto.result !== undefined) item.result = dto.result;

    return this.agendaItemRepository.save(item);
  }

  async delete(id: string): Promise<void> {
    const item = await this.findById(id);

    if (item.status !== AgendaItemStatus.PENDING) {
      throw new BadRequestException('So e possivel excluir pautas pendentes');
    }

    await this.agendaItemRepository.remove(item);
  }

  async startVoting(id: string): Promise<AgendaItemEntity> {
    const item = await this.findById(id);

    if (item.status !== AgendaItemStatus.PENDING) {
      throw new BadRequestException('So e possivel iniciar votacao em pautas pendentes');
    }

    // Verificar se a assembleia esta em andamento
    if (item.assembly.status !== AssemblyStatus.IN_PROGRESS) {
      throw new BadRequestException('A assembleia precisa estar em andamento para iniciar votacao');
    }

    // Verificar se nao ha outra pauta em votacao
    const votingItem = await this.agendaItemRepository.findOne({
      where: {
        assemblyId: item.assemblyId,
        status: AgendaItemStatus.VOTING,
      },
    });

    if (votingItem) {
      throw new BadRequestException('Ja existe uma pauta em votacao nesta assembleia');
    }

    item.status = AgendaItemStatus.VOTING;
    item.votingStartedAt = new Date();

    // Salva o item primeiro
    const savedItem = await this.agendaItemRepository.save(item);

    // Gera OTP automaticamente para a votacao
    await this.otpService.generateVotingOtp(savedItem.id, savedItem.assemblyId);

    // Recarrega o item com o OTP gerado
    return this.findById(savedItem.id);
  }

  async closeVoting(id: string): Promise<AgendaItemEntity> {
    const item = await this.findById(id);

    if (item.status !== AgendaItemStatus.VOTING) {
      throw new BadRequestException('So e possivel encerrar votacao em pautas em votacao');
    }

    // Calcular resultado
    const result = await this.getVoteResult(id);

    item.status = AgendaItemStatus.CLOSED;
    item.votingEndedAt = new Date();
    item.result = this.formatVoteResult(result);

    // Limpa OTP de votacao
    item.votingOtp = null;
    item.votingOtpGeneratedAt = null;
    item.votingOtpExpiresAt = null;

    return this.agendaItemRepository.save(item);
  }

  async getVoteResult(id: string): Promise<VoteResultDto> {
    const votes = await this.voteRepository.find({
      where: { agendaItemId: id },
    });

    const result: VoteResultDto = {
      yes: 0,
      no: 0,
      abstention: 0,
      total: 0,
      weightedYes: 0,
      weightedNo: 0,
      weightedAbstention: 0,
      weightedTotal: 0,
    };

    for (const vote of votes) {
      const weight = Number(vote.votingWeight);
      result.total++;
      result.weightedTotal += weight;

      switch (vote.choice) {
        case VoteChoice.YES:
          result.yes++;
          result.weightedYes += weight;
          break;
        case VoteChoice.NO:
          result.no++;
          result.weightedNo += weight;
          break;
        case VoteChoice.ABSTENTION:
          result.abstention++;
          result.weightedAbstention += weight;
          break;
      }
    }

    return result;
  }

  private formatVoteResult(result: VoteResultDto): string {
    const yesPercent = result.weightedTotal > 0
      ? ((result.weightedYes / result.weightedTotal) * 100).toFixed(1)
      : '0';
    const noPercent = result.weightedTotal > 0
      ? ((result.weightedNo / result.weightedTotal) * 100).toFixed(1)
      : '0';

    return `Aprovado: ${result.yes} (${yesPercent}%) | Reprovado: ${result.no} (${noPercent}%) | Abstencoes: ${result.abstention} | Total: ${result.total} votos`;
  }
}

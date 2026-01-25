import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AssemblyMinutesEntity,
  MinutesStatus,
  AssemblyEntity,
  AgendaItemEntity,
  AssemblyParticipantEntity,
  VoteEntity,
} from './entities';
import { UnitEntity } from '../units/unit.entity';
import {
  UpdateMinutesDto,
  VoteSummaryReport,
  AttendanceSummaryReport,
  AgendaItemVoteReport,
  ParticipantReport,
} from './dto/minutes.dto';
import { AssemblyStatus, AgendaItemStatus, VoteChoice } from '@attrio/contracts';

@Injectable()
export class MinutesService {
  constructor(
    @InjectRepository(AssemblyMinutesEntity)
    private readonly minutesRepository: Repository<AssemblyMinutesEntity>,
    @InjectRepository(AssemblyEntity)
    private readonly assemblyRepository: Repository<AssemblyEntity>,
    @InjectRepository(AgendaItemEntity)
    private readonly agendaItemRepository: Repository<AgendaItemEntity>,
    @InjectRepository(AssemblyParticipantEntity)
    private readonly participantRepository: Repository<AssemblyParticipantEntity>,
    @InjectRepository(VoteEntity)
    private readonly voteRepository: Repository<VoteEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
  ) {}

  /**
   * Busca ata por assembleia
   */
  async findByAssembly(assemblyId: string): Promise<AssemblyMinutesEntity | null> {
    return this.minutesRepository.findOne({
      where: { assemblyId },
      relations: ['assembly'],
    });
  }

  /**
   * Gera ata automaticamente baseada nos dados da assembleia
   */
  async generateMinutes(
    assemblyId: string,
    tenantId: string,
  ): Promise<{
    success: boolean;
    minutesId: string;
    content: string;
    summary: string;
    voteSummary: VoteSummaryReport;
    attendanceSummary: AttendanceSummaryReport;
  }> {
    // Busca assembleia com todas as relações
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId, tenantId },
      relations: ['tenant'],
    });

    if (!assembly) {
      throw new NotFoundException(`Assembleia com ID ${assemblyId} nao encontrada`);
    }

    if (assembly.status !== AssemblyStatus.FINISHED) {
      throw new BadRequestException('A ata so pode ser gerada apos a finalizacao da assembleia');
    }

    // Gera relatório de votação
    const voteSummary = await this.generateVoteSummary(assemblyId);

    // Gera relatório de presença
    const attendanceSummary = await this.generateAttendanceSummary(assemblyId, tenantId);

    // Gera conteúdo da ata
    const content = this.generateMinutesContent(assembly, voteSummary, attendanceSummary);

    // Gera resumo
    const summary = this.generateSummary(assembly, voteSummary, attendanceSummary);

    // Verifica se já existe ata
    let minutes = await this.findByAssembly(assemblyId);

    if (minutes) {
      // Atualiza ata existente
      minutes.content = content;
      minutes.summary = summary;
      minutes.voteSummary = voteSummary as unknown as Record<string, unknown>;
      minutes.attendanceSummary = attendanceSummary as unknown as Record<string, unknown>;
      minutes.status = MinutesStatus.DRAFT;
    } else {
      // Cria nova ata
      minutes = this.minutesRepository.create({
        assemblyId,
        content,
        summary,
        voteSummary: voteSummary as unknown as Record<string, unknown>,
        attendanceSummary: attendanceSummary as unknown as Record<string, unknown>,
        status: MinutesStatus.DRAFT,
      });
    }

    await this.minutesRepository.save(minutes);

    return {
      success: true,
      minutesId: minutes.id,
      content,
      summary,
      voteSummary,
      attendanceSummary,
    };
  }

  /**
   * Atualiza ata manualmente
   */
  async update(assemblyId: string, dto: UpdateMinutesDto): Promise<AssemblyMinutesEntity> {
    const minutes = await this.findByAssembly(assemblyId);

    if (!minutes) {
      throw new NotFoundException('Ata nao encontrada para esta assembleia');
    }

    if (minutes.status === MinutesStatus.PUBLISHED) {
      throw new BadRequestException('Ata ja publicada nao pode ser alterada');
    }

    if (dto.content !== undefined) minutes.content = dto.content;
    if (dto.summary !== undefined) minutes.summary = dto.summary;
    if (dto.status !== undefined) minutes.status = dto.status;

    return this.minutesRepository.save(minutes);
  }

  /**
   * Aprova a ata
   */
  async approve(assemblyId: string, userId: string): Promise<AssemblyMinutesEntity> {
    const minutes = await this.findByAssembly(assemblyId);

    if (!minutes) {
      throw new NotFoundException('Ata nao encontrada para esta assembleia');
    }

    if (minutes.status === MinutesStatus.PUBLISHED) {
      throw new BadRequestException('Ata ja publicada');
    }

    minutes.status = MinutesStatus.APPROVED;
    minutes.approvedBy = userId;
    minutes.approvedAt = new Date();

    return this.minutesRepository.save(minutes);
  }

  /**
   * Publica a ata
   */
  async publish(assemblyId: string): Promise<AssemblyMinutesEntity> {
    const minutes = await this.findByAssembly(assemblyId);

    if (!minutes) {
      throw new NotFoundException('Ata nao encontrada para esta assembleia');
    }

    if (minutes.status !== MinutesStatus.APPROVED) {
      throw new BadRequestException('Ata precisa ser aprovada antes de publicar');
    }

    minutes.status = MinutesStatus.PUBLISHED;

    return this.minutesRepository.save(minutes);
  }

  /**
   * Gera relatório de votação
   */
  private async generateVoteSummary(assemblyId: string): Promise<VoteSummaryReport> {
    const agendaItems = await this.agendaItemRepository.find({
      where: { assemblyId },
      order: { orderIndex: 'ASC' },
    });

    const items: AgendaItemVoteReport[] = [];

    for (const item of agendaItems) {
      const votes = await this.voteRepository.find({
        where: { agendaItemId: item.id },
      });

      let yes = 0,
        no = 0,
        abstention = 0;

      for (const vote of votes) {
        switch (vote.choice) {
          case VoteChoice.YES:
            yes++;
            break;
          case VoteChoice.NO:
            no++;
            break;
          case VoteChoice.ABSTENTION:
            abstention++;
            break;
        }
      }

      const total = yes + no + abstention;
      const approved = yes > no;

      items.push({
        title: item.title,
        order: item.orderIndex,
        yes,
        no,
        abstention,
        total,
        result: item.result || (approved ? 'Aprovado' : 'Reprovado'),
        approved,
      });
    }

    return {
      totalAgendaItems: agendaItems.length,
      votedItems: items.filter((i) => i.total > 0).length,
      items,
    };
  }

  /**
   * Gera relatório de presença
   */
  private async generateAttendanceSummary(
    assemblyId: string,
    tenantId: string,
  ): Promise<AttendanceSummaryReport> {
    const totalUnits = await this.unitRepository.count({ where: { tenantId } });

    const participants = await this.participantRepository.find({
      where: { assemblyId },
      relations: ['unit', 'resident'],
    });

    let totalVotingWeight = 0;
    let presentVotingWeight = 0;
    const participantReports: ParticipantReport[] = [];

    for (const p of participants) {
      const weight = Number(p.votingWeight);
      totalVotingWeight += weight;

      if (p.joinedAt) {
        presentVotingWeight += weight;
      }

      participantReports.push({
        unitIdentifier: p.unit?.identifier || 'N/A',
        representedBy: p.proxyName || p.resident?.fullName || 'N/A',
        isProxy: !!p.proxyName,
        joinedAt: p.joinedAt || undefined,
        leftAt: p.leftAt || undefined,
      });
    }

    const presentUnits = participants.filter((p) => p.joinedAt).length;
    const quorumPercentage = totalUnits > 0 ? (presentUnits / totalUnits) * 100 : 0;

    return {
      totalUnits,
      presentUnits,
      quorumPercentage: Math.round(quorumPercentage * 100) / 100,
      totalVotingWeight,
      presentVotingWeight,
      participants: participantReports,
    };
  }

  /**
   * Gera conteúdo textual da ata
   */
  private generateMinutesContent(
    assembly: AssemblyEntity,
    voteSummary: VoteSummaryReport,
    attendanceSummary: AttendanceSummaryReport,
  ): string {
    const lines: string[] = [];

    // Cabeçalho
    lines.push(`ATA DA ${assembly.title.toUpperCase()}`);
    lines.push('');
    lines.push(`Data: ${assembly.scheduledAt.toLocaleDateString('pt-BR')}`);
    lines.push(`Horario de inicio: ${assembly.startedAt?.toLocaleTimeString('pt-BR') || 'N/A'}`);
    lines.push(`Horario de encerramento: ${assembly.finishedAt?.toLocaleTimeString('pt-BR') || 'N/A'}`);
    lines.push('');

    // Presença
    lines.push('PRESENCA:');
    lines.push(`- Total de unidades: ${attendanceSummary.totalUnits}`);
    lines.push(`- Unidades presentes: ${attendanceSummary.presentUnits}`);
    lines.push(`- Quorum: ${attendanceSummary.quorumPercentage}%`);
    lines.push('');

    // Lista de presentes
    lines.push('PARTICIPANTES:');
    for (const p of attendanceSummary.participants) {
      const proxyInfo = p.isProxy ? ' (procurador)' : '';
      lines.push(`- ${p.unitIdentifier}: ${p.representedBy}${proxyInfo}`);
    }
    lines.push('');

    // Deliberações
    lines.push('DELIBERACOES:');
    lines.push('');

    for (const item of voteSummary.items) {
      lines.push(`${item.order + 1}. ${item.title}`);
      lines.push(`   Votacao: SIM: ${item.yes} | NAO: ${item.no} | ABSTENCAO: ${item.abstention}`);
      lines.push(`   Resultado: ${item.result}`);
      lines.push('');
    }

    // Encerramento
    lines.push('ENCERRAMENTO:');
    lines.push(
      `Nada mais havendo a tratar, foi encerrada a assembleia, da qual foi lavrada a presente ata.`,
    );

    return lines.join('\n');
  }

  /**
   * Gera resumo executivo
   */
  private generateSummary(
    assembly: AssemblyEntity,
    voteSummary: VoteSummaryReport,
    attendanceSummary: AttendanceSummaryReport,
  ): string {
    const approvedItems = voteSummary.items.filter((i) => i.approved).length;
    const rejectedItems = voteSummary.items.filter((i) => !i.approved && i.total > 0).length;

    return `Assembleia "${assembly.title}" realizada em ${assembly.scheduledAt.toLocaleDateString('pt-BR')} ` +
      `com quorum de ${attendanceSummary.quorumPercentage}% (${attendanceSummary.presentUnits}/${attendanceSummary.totalUnits} unidades). ` +
      `Foram votadas ${voteSummary.votedItems} pautas, sendo ${approvedItems} aprovadas e ${rejectedItems} rejeitadas.`;
  }
}

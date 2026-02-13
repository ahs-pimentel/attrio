import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AssemblyEntity,
  AssemblyParticipantEntity,
  AgendaItemEntity,
  VoteEntity,
} from './entities';
import { ParticipantApprovalStatus, AgendaItemStatus, AssemblyStatus } from '@attrio/contracts';

export interface SessionData {
  participantId: string;
  assemblyId: string;
  assemblyTitle: string;
  assemblyStatus: AssemblyStatus;
  unitIdentifier: string;
  proxyName: string | null;
  approvalStatus: ParticipantApprovalStatus;
  rejectionReason: string | null;
  checkinTime: Date;
  canVote: boolean;
}

export interface AgendaItemForParticipant {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  status: AgendaItemStatus;
  hasVoted: boolean;
  votingOtpRequired: boolean;
}

export interface ParticipantStatus {
  isPresent: boolean;
  approvalStatus: ParticipantApprovalStatus;
  canVote: boolean;
  message: string;
}

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(AssemblyEntity)
    private readonly assemblyRepository: Repository<AssemblyEntity>,
    @InjectRepository(AssemblyParticipantEntity)
    private readonly participantRepository: Repository<AssemblyParticipantEntity>,
    @InjectRepository(AgendaItemEntity)
    private readonly agendaItemRepository: Repository<AgendaItemEntity>,
    @InjectRepository(VoteEntity)
    private readonly voteRepository: Repository<VoteEntity>,
  ) {}

  /**
   * Valida session token e retorna dados da sessao
   */
  async validateSession(sessionToken: string): Promise<SessionData> {
    const participant = await this.participantRepository.findOne({
      where: { sessionToken },
      relations: ['unit', 'assembly'],
    });

    if (!participant) {
      throw new NotFoundException('Sessao invalida ou expirada');
    }

    if (!participant.joinedAt) {
      throw new ForbiddenException('Participante nao fez check-in');
    }

    if (participant.leftAt) {
      throw new ForbiddenException('Participante ja saiu da assembleia');
    }

    const canVote =
      participant.approvalStatus === ParticipantApprovalStatus.APPROVED &&
      participant.assembly?.status === AssemblyStatus.IN_PROGRESS;

    return {
      participantId: participant.id,
      assemblyId: participant.assemblyId,
      assemblyTitle: participant.assembly?.title || '',
      assemblyStatus: participant.assembly?.status || AssemblyStatus.SCHEDULED,
      unitIdentifier: participant.unit?.identifier || 'N/A',
      proxyName: participant.proxyName,
      approvalStatus: participant.approvalStatus,
      rejectionReason: participant.rejectionReason,
      checkinTime: participant.joinedAt,
      canVote,
    };
  }

  /**
   * Lista pautas da assembleia para o participante
   */
  async getAgendaItems(sessionToken: string): Promise<AgendaItemForParticipant[]> {
    const session = await this.validateSession(sessionToken);

    const agendaItems = await this.agendaItemRepository.find({
      where: { assemblyId: session.assemblyId },
      order: { orderIndex: 'ASC' },
    });

    // Busca votos do participante
    const votes = await this.voteRepository.find({
      where: { participantId: session.participantId },
    });

    const votedAgendaItemIds = new Set(votes.map((v) => v.agendaItemId));

    return agendaItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      orderIndex: item.orderIndex,
      status: item.status,
      hasVoted: votedAgendaItemIds.has(item.id),
      votingOtpRequired: item.status === AgendaItemStatus.VOTING && !!item.votingOtp,
    }));
  }

  /**
   * Retorna status do participante
   */
  async getParticipantStatus(sessionToken: string): Promise<ParticipantStatus> {
    const session = await this.validateSession(sessionToken);

    let message = '';
    let canVote = false;

    switch (session.approvalStatus) {
      case ParticipantApprovalStatus.PENDING:
        message = 'Aguardando aprovacao da procuracao pelo sindico';
        break;
      case ParticipantApprovalStatus.REJECTED:
        message = `Procuracao rejeitada: ${session.rejectionReason || 'Motivo nao informado'}`;
        break;
      case ParticipantApprovalStatus.APPROVED:
        if (session.assemblyStatus === AssemblyStatus.IN_PROGRESS) {
          message = 'Voce esta apto a votar';
          canVote = true;
        } else if (session.assemblyStatus === AssemblyStatus.SCHEDULED) {
          message = 'Aguardando inicio da assembleia';
        } else {
          message = 'Assembleia encerrada';
        }
        break;
    }

    return {
      isPresent: true,
      approvalStatus: session.approvalStatus,
      canVote,
      message,
    };
  }

  /**
   * Obtem detalhes de uma pauta especifica
   */
  async getAgendaItemDetails(
    sessionToken: string,
    agendaItemId: string,
  ): Promise<{
    item: AgendaItemForParticipant;
    canVote: boolean;
    hasVoted: boolean;
    votingOtpRequired: boolean;
  }> {
    const session = await this.validateSession(sessionToken);

    const item = await this.agendaItemRepository.findOne({
      where: { id: agendaItemId, assemblyId: session.assemblyId },
    });

    if (!item) {
      throw new NotFoundException('Pauta nao encontrada');
    }

    // Verifica se ja votou
    const existingVote = await this.voteRepository.findOne({
      where: { agendaItemId, participantId: session.participantId },
    });

    const canVote =
      session.canVote &&
      item.status === AgendaItemStatus.VOTING &&
      !existingVote;

    return {
      item: {
        id: item.id,
        title: item.title,
        description: item.description,
        orderIndex: item.orderIndex,
        status: item.status,
        hasVoted: !!existingVote,
        votingOtpRequired: item.status === AgendaItemStatus.VOTING && !!item.votingOtp,
      },
      canVote,
      hasVoted: !!existingVote,
      votingOtpRequired: !!item.votingOtp,
    };
  }
}

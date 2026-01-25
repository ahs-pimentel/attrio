import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoteEntity, AgendaItemEntity, AssemblyParticipantEntity } from './entities';
import { CastVoteDto, VoteSummaryDto } from './dto';
import { AgendaItemStatus, VoteChoice } from '@attrio/contracts';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(VoteEntity)
    private readonly voteRepository: Repository<VoteEntity>,
    @InjectRepository(AgendaItemEntity)
    private readonly agendaItemRepository: Repository<AgendaItemEntity>,
    @InjectRepository(AssemblyParticipantEntity)
    private readonly participantRepository: Repository<AssemblyParticipantEntity>,
  ) {}

  async findByAgendaItem(agendaItemId: string): Promise<VoteEntity[]> {
    return this.voteRepository.find({
      where: { agendaItemId },
      relations: ['participant', 'participant.unit'],
    });
  }

  async findByParticipant(participantId: string): Promise<VoteEntity[]> {
    return this.voteRepository.find({
      where: { participantId },
      relations: ['agendaItem'],
    });
  }

  async castVote(
    agendaItemId: string,
    participantId: string,
    dto: CastVoteDto,
  ): Promise<VoteEntity> {
    // Verificar se a pauta existe e esta em votacao
    const agendaItem = await this.agendaItemRepository.findOne({
      where: { id: agendaItemId },
    });

    if (!agendaItem) {
      throw new NotFoundException(`Pauta com ID ${agendaItemId} nao encontrada`);
    }

    if (agendaItem.status !== AgendaItemStatus.VOTING) {
      throw new BadRequestException('Esta pauta nao esta em votacao');
    }

    // Verificar se o participante existe
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException(`Participante com ID ${participantId} nao encontrado`);
    }

    // Verificar se o participante pertence a esta assembleia
    if (participant.assemblyId !== agendaItem.assemblyId) {
      throw new BadRequestException('Participante nao pertence a esta assembleia');
    }

    // Verificar se ja votou
    const existingVote = await this.voteRepository.findOne({
      where: { agendaItemId, participantId },
    });

    if (existingVote) {
      throw new ConflictException('Este participante ja votou nesta pauta');
    }

    // Criar o voto com o peso do participante no momento da votacao
    const vote = this.voteRepository.create({
      agendaItemId,
      participantId,
      choice: dto.choice,
      votingWeight: participant.votingWeight,
    });

    return this.voteRepository.save(vote);
  }

  async getVoteSummary(agendaItemId: string): Promise<VoteSummaryDto> {
    const votes = await this.findByAgendaItem(agendaItemId);

    const summary: VoteSummaryDto = {
      yes: 0,
      no: 0,
      abstention: 0,
      total: 0,
      weightedYes: 0,
      weightedNo: 0,
      weightedAbstention: 0,
      weightedTotal: 0,
      yesPercentage: 0,
      noPercentage: 0,
      abstentionPercentage: 0,
    };

    for (const vote of votes) {
      const weight = Number(vote.votingWeight);
      summary.total++;
      summary.weightedTotal += weight;

      switch (vote.choice) {
        case VoteChoice.YES:
          summary.yes++;
          summary.weightedYes += weight;
          break;
        case VoteChoice.NO:
          summary.no++;
          summary.weightedNo += weight;
          break;
        case VoteChoice.ABSTENTION:
          summary.abstention++;
          summary.weightedAbstention += weight;
          break;
      }
    }

    // Calcular percentuais
    if (summary.weightedTotal > 0) {
      summary.yesPercentage = (summary.weightedYes / summary.weightedTotal) * 100;
      summary.noPercentage = (summary.weightedNo / summary.weightedTotal) * 100;
      summary.abstentionPercentage = (summary.weightedAbstention / summary.weightedTotal) * 100;
    }

    return summary;
  }

  async hasVoted(agendaItemId: string, participantId: string): Promise<boolean> {
    const vote = await this.voteRepository.findOne({
      where: { agendaItemId, participantId },
    });
    return !!vote;
  }

  async getVoteByParticipantAndItem(
    agendaItemId: string,
    participantId: string,
  ): Promise<VoteEntity | null> {
    return this.voteRepository.findOne({
      where: { agendaItemId, participantId },
    });
  }
}

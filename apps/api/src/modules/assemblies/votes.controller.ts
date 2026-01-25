import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { VotesService } from './votes.service';
import { CastVoteDto, VoteResponseDto, VoteSummaryDto } from './dto';
import { RequireTenant } from '../auth';

@ApiTags('Votos de Assembleia')
@ApiBearerAuth()
@Controller('assemblies/:assemblyId/agenda-items/:agendaItemId/votes')
@RequireTenant()
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar votos de uma pauta' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'agendaItemId', description: 'ID da pauta' })
  @ApiResponse({ status: 200, type: [VoteResponseDto] })
  async findByAgendaItem(
    @Param('agendaItemId', ParseUUIDPipe) agendaItemId: string,
  ): Promise<VoteResponseDto[]> {
    return this.votesService.findByAgendaItem(agendaItemId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Obter resumo dos votos' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'agendaItemId', description: 'ID da pauta' })
  @ApiResponse({ status: 200, type: VoteSummaryDto })
  async getSummary(
    @Param('agendaItemId', ParseUUIDPipe) agendaItemId: string,
  ): Promise<VoteSummaryDto> {
    return this.votesService.getVoteSummary(agendaItemId);
  }

  @Post(':participantId')
  @ApiOperation({ summary: 'Registrar voto de um participante' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'agendaItemId', description: 'ID da pauta' })
  @ApiParam({ name: 'participantId', description: 'ID do participante' })
  @ApiResponse({ status: 201, type: VoteResponseDto })
  @ApiResponse({ status: 400, description: 'Pauta nao esta em votacao' })
  @ApiResponse({ status: 409, description: 'Participante ja votou' })
  async castVote(
    @Param('agendaItemId', ParseUUIDPipe) agendaItemId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Body() dto: CastVoteDto,
  ): Promise<VoteResponseDto> {
    return this.votesService.castVote(agendaItemId, participantId, dto);
  }

  @Get('check/:participantId')
  @ApiOperation({ summary: 'Verificar se participante ja votou' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'agendaItemId', description: 'ID da pauta' })
  @ApiParam({ name: 'participantId', description: 'ID do participante' })
  @ApiResponse({ status: 200 })
  async checkVote(
    @Param('agendaItemId', ParseUUIDPipe) agendaItemId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ): Promise<{ hasVoted: boolean; vote?: VoteResponseDto }> {
    const hasVoted = await this.votesService.hasVoted(agendaItemId, participantId);
    if (hasVoted) {
      const vote = await this.votesService.getVoteByParticipantAndItem(agendaItemId, participantId);
      return { hasVoted: true, vote: vote || undefined };
    }
    return { hasVoted: false };
  }
}

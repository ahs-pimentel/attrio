import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UnauthorizedException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { SessionService } from './session.service';
import { VotesService } from './votes.service';
import { OtpService } from './otp.service';
import { Public } from '../auth';
import { VoteChoice, ParticipantApprovalStatus, AgendaItemStatus, AssemblyStatus } from '@attrio/contracts';
import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';

// ==================== DTOs ====================

class SessionDataDto {
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

class AgendaItemForParticipantDto {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  status: AgendaItemStatus;
  hasVoted: boolean;
  votingOtpRequired: boolean;
}

class ParticipantStatusDto {
  isPresent: boolean;
  approvalStatus: ParticipantApprovalStatus;
  canVote: boolean;
  message: string;
}

class CastVoteRequestDto {
  @IsUUID()
  agendaItemId: string;

  @IsOptional()
  @IsString()
  otp: string;

  @IsEnum(VoteChoice)
  choice: VoteChoice;
}

class VoteResultDto {
  success: boolean;
  voteId: string;
  choice: VoteChoice;
  votedAt: Date;
}

@ApiTags('Sessao do Participante')
@Controller('assemblies/session')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly votesService: VotesService,
    private readonly otpService: OtpService,
  ) {}

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Validar sessao e obter dados do participante' })
  @ApiParam({ name: 'token', description: 'Token de sessao do participante' })
  @ApiResponse({ status: 200, type: SessionDataDto })
  async validateSession(@Param('token') sessionToken: string): Promise<SessionDataDto> {
    return this.sessionService.validateSession(sessionToken);
  }

  @Get(':token/agenda')
  @Public()
  @ApiOperation({ summary: 'Listar pautas da assembleia' })
  @ApiParam({ name: 'token', description: 'Token de sessao do participante' })
  @ApiResponse({ status: 200, type: [AgendaItemForParticipantDto] })
  async getAgendaItems(
    @Param('token') sessionToken: string,
  ): Promise<AgendaItemForParticipantDto[]> {
    return this.sessionService.getAgendaItems(sessionToken);
  }

  @Get(':token/agenda/:agendaItemId')
  @Public()
  @ApiOperation({ summary: 'Obter detalhes de uma pauta' })
  @ApiParam({ name: 'token', description: 'Token de sessao do participante' })
  @ApiParam({ name: 'agendaItemId', description: 'ID da pauta' })
  async getAgendaItemDetails(
    @Param('token') sessionToken: string,
    @Param('agendaItemId', ParseUUIDPipe) agendaItemId: string,
  ) {
    return this.sessionService.getAgendaItemDetails(sessionToken, agendaItemId);
  }

  @Get(':token/status')
  @Public()
  @ApiOperation({ summary: 'Obter status do participante' })
  @ApiParam({ name: 'token', description: 'Token de sessao do participante' })
  @ApiResponse({ status: 200, type: ParticipantStatusDto })
  async getParticipantStatus(
    @Param('token') sessionToken: string,
  ): Promise<ParticipantStatusDto> {
    return this.sessionService.getParticipantStatus(sessionToken);
  }

  @Post(':token/vote')
  @Public()
  @ApiOperation({ summary: 'Registrar voto em uma pauta' })
  @ApiParam({ name: 'token', description: 'Token de sessao do participante' })
  @ApiResponse({ status: 201, type: VoteResultDto })
  async castVote(
    @Param('token') sessionToken: string,
    @Body() dto: CastVoteRequestDto,
  ): Promise<VoteResultDto> {
    // Valida sessao
    const session = await this.sessionService.validateSession(sessionToken);

    if (!session.canVote) {
      throw new UnauthorizedException('Voce nao esta autorizado a votar');
    }

    // Valida OTP da pauta (so se a pauta tiver OTP configurado)
    const agendaDetails = await this.sessionService.getAgendaItemDetails(sessionToken, dto.agendaItemId);
    if (agendaDetails.votingOtpRequired) {
      const otpValid = await this.otpService.validateVotingOtp(dto.agendaItemId, dto.otp);
      if (!otpValid) {
        throw new UnauthorizedException('OTP de votacao invalido ou expirado');
      }
    }

    // Registra voto
    const vote = await this.votesService.castVote(
      dto.agendaItemId,
      session.participantId,
      { choice: dto.choice },
    );

    return {
      success: true,
      voteId: vote.id,
      choice: vote.choice,
      votedAt: vote.createdAt,
    };
  }
}

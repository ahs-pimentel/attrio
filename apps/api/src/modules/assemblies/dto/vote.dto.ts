import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { VoteChoice } from '@attrio/contracts';

export class CastVoteDto {
  @ApiProperty({ enum: VoteChoice, description: 'Escolha do voto' })
  @IsEnum(VoteChoice)
  @IsNotEmpty()
  choice: VoteChoice;
}

export class VoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  agendaItemId: string;

  @ApiProperty()
  participantId: string;

  @ApiProperty({ enum: VoteChoice })
  choice: VoteChoice;

  @ApiProperty()
  votingWeight: number;

  @ApiProperty()
  createdAt: Date;
}

export class VoteSummaryDto {
  @ApiProperty({ description: 'Total de votos SIM' })
  yes: number;

  @ApiProperty({ description: 'Total de votos NAO' })
  no: number;

  @ApiProperty({ description: 'Total de abstencoes' })
  abstention: number;

  @ApiProperty({ description: 'Total de votos' })
  total: number;

  @ApiProperty({ description: 'Peso total dos votos SIM' })
  weightedYes: number;

  @ApiProperty({ description: 'Peso total dos votos NAO' })
  weightedNo: number;

  @ApiProperty({ description: 'Peso total das abstencoes' })
  weightedAbstention: number;

  @ApiProperty({ description: 'Peso total de todos os votos' })
  weightedTotal: number;

  @ApiProperty({ description: 'Percentual de SIM (ponderado)' })
  yesPercentage: number;

  @ApiProperty({ description: 'Percentual de NAO (ponderado)' })
  noPercentage: number;

  @ApiProperty({ description: 'Percentual de abstencao (ponderado)' })
  abstentionPercentage: number;
}

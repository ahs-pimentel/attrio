import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { AgendaItemStatus } from '@attrio/contracts';

export class CreateAgendaItemDto {
  @ApiProperty({ description: 'Titulo da pauta', example: 'Aprovacao de contas 2023' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Descricao detalhada da pauta' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Ordem de apresentacao', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Requer quorum para votacao', default: true })
  @IsBoolean()
  @IsOptional()
  requiresQuorum?: boolean;

  @ApiPropertyOptional({
    description: 'Tipo de quorum necessario',
    example: 'simple',
    enum: ['simple', 'qualified', 'unanimous'],
  })
  @IsString()
  @IsOptional()
  quorumType?: string;
}

export class UpdateAgendaItemDto {
  @ApiPropertyOptional({ description: 'Titulo da pauta' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Descricao detalhada da pauta' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Ordem de apresentacao' })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Requer quorum para votacao' })
  @IsBoolean()
  @IsOptional()
  requiresQuorum?: boolean;

  @ApiPropertyOptional({ description: 'Tipo de quorum necessario' })
  @IsString()
  @IsOptional()
  quorumType?: string;

  @ApiPropertyOptional({ enum: AgendaItemStatus, description: 'Status da pauta' })
  @IsEnum(AgendaItemStatus)
  @IsOptional()
  status?: AgendaItemStatus;

  @ApiPropertyOptional({ description: 'Resultado da votacao' })
  @IsString()
  @IsOptional()
  result?: string;
}

export class AgendaItemDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  assemblyId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty({ enum: AgendaItemStatus })
  status: AgendaItemStatus;

  @ApiProperty()
  requiresQuorum: boolean;

  @ApiProperty()
  quorumType: string;

  @ApiPropertyOptional({ nullable: true })
  votingStartedAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  votingEndedAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  result?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  voteResult?: VoteResultDto;
}

export class VoteResultDto {
  @ApiProperty()
  yes: number;

  @ApiProperty()
  no: number;

  @ApiProperty()
  abstention: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ description: 'Votos ponderados a favor' })
  weightedYes: number;

  @ApiProperty({ description: 'Votos ponderados contra' })
  weightedNo: number;

  @ApiProperty({ description: 'Votos ponderados abstencao' })
  weightedAbstention: number;

  @ApiProperty({ description: 'Total de peso dos votos' })
  weightedTotal: number;
}

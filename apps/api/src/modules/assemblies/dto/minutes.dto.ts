import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { MinutesStatus } from '../entities/assembly-minutes.entity';

export class CreateMinutesDto {
  @ApiPropertyOptional({ description: 'Conteudo da ata' })
  @IsString()
  @IsOptional()
  content?: string;
}

export class UpdateMinutesDto {
  @ApiPropertyOptional({ description: 'Conteudo da ata' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Resumo da ata' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ enum: MinutesStatus })
  @IsEnum(MinutesStatus)
  @IsOptional()
  status?: MinutesStatus;
}

export class MinutesResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  assemblyId: string;

  @ApiPropertyOptional({ nullable: true })
  content?: string | null;

  @ApiPropertyOptional({ nullable: true })
  summary?: string | null;

  @ApiPropertyOptional({ nullable: true })
  transcription?: string | null;

  @ApiProperty({ enum: MinutesStatus })
  status: MinutesStatus;

  @ApiPropertyOptional({ nullable: true })
  pdfUrl?: string | null;

  @ApiPropertyOptional()
  voteSummary?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  attendanceSummary?: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true })
  approvedBy?: string | null;

  @ApiPropertyOptional({ nullable: true })
  approvedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// Classes auxiliares devem vir antes de serem usadas
export class AgendaItemVoteReport {
  @ApiProperty()
  title: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  yes: number;

  @ApiProperty()
  no: number;

  @ApiProperty()
  abstention: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  result: string;

  @ApiProperty()
  approved: boolean;
}

export class ParticipantReport {
  @ApiProperty()
  unitIdentifier: string;

  @ApiProperty()
  representedBy: string;

  @ApiProperty()
  isProxy: boolean;

  @ApiPropertyOptional()
  joinedAt?: Date;

  @ApiPropertyOptional()
  leftAt?: Date;
}

export class VoteSummaryReport {
  @ApiProperty()
  totalAgendaItems: number;

  @ApiProperty()
  votedItems: number;

  @ApiProperty({ type: [AgendaItemVoteReport] })
  items: AgendaItemVoteReport[];
}

export class AttendanceSummaryReport {
  @ApiProperty()
  totalUnits: number;

  @ApiProperty()
  presentUnits: number;

  @ApiProperty()
  quorumPercentage: number;

  @ApiProperty()
  totalVotingWeight: number;

  @ApiProperty()
  presentVotingWeight: number;

  @ApiProperty({ type: [ParticipantReport] })
  participants: ParticipantReport[];
}

export class GenerateMinutesResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  minutesId: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiProperty()
  voteSummary: VoteSummaryReport;

  @ApiProperty()
  attendanceSummary: AttendanceSummaryReport;
}

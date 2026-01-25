import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsUrl,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { AssemblyStatus } from '@attrio/contracts';

export class CreateAssemblyDto {
  @ApiProperty({ description: 'Titulo da assembleia', example: 'Assembleia Geral Ordinaria 2024' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Descricao detalhada' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Data e hora agendada', example: '2024-03-15T19:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'URL da reuniao virtual', example: 'https://meet.google.com/xxx-xxxx-xxx' })
  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  meetingUrl?: string;
}

export class UpdateAssemblyDto {
  @ApiPropertyOptional({ description: 'Titulo da assembleia' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Descricao detalhada' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Data e hora agendada' })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'URL da reuniao virtual' })
  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  meetingUrl?: string;

  @ApiPropertyOptional({ enum: AssemblyStatus, description: 'Status da assembleia' })
  @IsEnum(AssemblyStatus)
  @IsOptional()
  status?: AssemblyStatus;
}

export class AssemblyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty()
  scheduledAt: Date;

  @ApiPropertyOptional({ nullable: true })
  startedAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  finishedAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  meetingUrl?: string | null;

  @ApiProperty({ enum: AssemblyStatus })
  status: AssemblyStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  participantsCount?: number;

  @ApiPropertyOptional()
  agendaItemsCount?: number;
}

export class AssemblyDetailResponseDto extends AssemblyResponseDto {
  @ApiPropertyOptional({ type: () => [AgendaItemResponseDto] })
  agendaItems?: AgendaItemResponseDto[];

  @ApiPropertyOptional({ type: () => [ParticipantResponseDto] })
  participants?: ParticipantResponseDto[];
}

// Forward declarations for nested types
export class AgendaItemResponseDto {
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

  @ApiProperty()
  status: string;

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
}

export class ParticipantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  assemblyId: string;

  @ApiProperty()
  unitId: string;

  @ApiPropertyOptional({ nullable: true })
  residentId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  proxyName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  joinedAt?: Date | null;

  @ApiProperty()
  votingWeight: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  unitIdentifier?: string;

  @ApiPropertyOptional()
  residentName?: string;
}

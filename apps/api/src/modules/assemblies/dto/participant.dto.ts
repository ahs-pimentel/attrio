import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class RegisterParticipantDto {
  @ApiProperty({ description: 'ID da unidade' })
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @ApiPropertyOptional({ description: 'ID do morador (se for o proprio morador)' })
  @IsUUID()
  @IsOptional()
  residentId?: string;

  @ApiPropertyOptional({ description: 'Nome do procurador (se nao for o morador)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  proxyName?: string;

  @ApiPropertyOptional({ description: 'Documento do procurador' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  proxyDocument?: string;

  @ApiPropertyOptional({ description: 'Peso do voto (fracao ideal)', default: 1 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  votingWeight?: number;
}

export class UpdateParticipantDto {
  @ApiPropertyOptional({ description: 'Nome do procurador' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  proxyName?: string;

  @ApiPropertyOptional({ description: 'Documento do procurador' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  proxyDocument?: string;

  @ApiPropertyOptional({ description: 'Peso do voto' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  votingWeight?: number;
}

export class ParticipantDetailResponseDto {
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
  proxyDocument?: string | null;

  @ApiPropertyOptional({ nullable: true })
  joinedAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  leftAt?: Date | null;

  @ApiProperty()
  votingWeight: number;

  @ApiProperty()
  createdAt: Date;

  // Relations - these are the full entity types when loaded
  @ApiPropertyOptional()
  unit?: unknown;

  @ApiPropertyOptional()
  resident?: unknown;

  // Flat fields for frontend convenience
  @ApiPropertyOptional({ description: 'Identificador da unidade (ex: A-101)' })
  unitIdentifier?: string | null;

  @ApiPropertyOptional({ description: 'Nome do morador' })
  residentName?: string | null;
}

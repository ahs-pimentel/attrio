import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { IssueStatus, IssuePriority } from '@attrio/contracts';

export class CreateIssueDto {
  @ApiProperty({ description: 'Titulo da ocorrencia' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Descricao da ocorrencia' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'ID da unidade' })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({ enum: IssuePriority, default: IssuePriority.MEDIUM })
  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;
}

export class UpdateIssueDto {
  @ApiPropertyOptional({ description: 'Titulo da ocorrencia' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Descricao da ocorrencia' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: IssuePriority })
  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @ApiPropertyOptional({ enum: IssueStatus })
  @IsEnum(IssueStatus)
  @IsOptional()
  status?: IssueStatus;
}

export class IssueResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty({ type: String, nullable: true })
  unitId: string | null;

  @ApiProperty({ type: String, nullable: true })
  unitIdentifier: string | null;

  @ApiProperty({ type: String, nullable: true })
  categoryId: string | null;

  @ApiProperty({ type: String, nullable: true })
  categoryName: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: IssueStatus })
  status: IssueStatus;

  @ApiProperty({ enum: IssuePriority })
  priority: IssuePriority;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdByName: string;

  @ApiProperty({ type: String, nullable: true })
  resolvedBy: string | null;

  @ApiProperty({ type: String, nullable: true })
  resolvedByName: string | null;

  @ApiProperty({ type: Date, nullable: true })
  resolvedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

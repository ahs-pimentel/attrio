import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { AnnouncementType } from '@attrio/contracts';

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Titulo do comunicado' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Conteudo HTML do comunicado' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: AnnouncementType, default: AnnouncementType.GENERAL })
  @IsEnum(AnnouncementType)
  @IsOptional()
  type?: AnnouncementType;
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({ description: 'Titulo do comunicado' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Conteudo HTML do comunicado' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Publicado' })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}

export class AnnouncementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: AnnouncementType })
  type: AnnouncementType;

  @ApiProperty({ type: String, nullable: true })
  assemblyId: string | null;

  @ApiProperty()
  published: boolean;

  @ApiProperty({ type: String, nullable: true })
  createdBy: string | null;

  @ApiProperty({ type: String, nullable: true })
  createdByName: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ description: 'Numero de visualizacoes' })
  viewCount: number;

  @ApiProperty({ description: 'Numero de curtidas' })
  likeCount: number;

  @ApiProperty({ description: 'Se o usuario atual curtiu' })
  likedByMe: boolean;
}

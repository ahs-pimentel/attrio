import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { UnitStatus } from '@attrio/contracts';

export class CreateUnitDto {
  @ApiProperty({ description: 'Bloco da unidade', example: 'A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  block: string;

  @ApiProperty({ description: 'Numero da unidade', example: '101' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  number: string;

  @ApiPropertyOptional({
    description: 'Identificador unico (gerado automaticamente se nao informado)',
    example: 'A-101',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  identifier?: string;
}

export class UpdateUnitDto {
  @ApiPropertyOptional({ description: 'Bloco da unidade' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  block?: string;

  @ApiPropertyOptional({ description: 'Numero da unidade' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  number?: string;

  @ApiPropertyOptional({ description: 'Identificador unico' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  identifier?: string;

  @ApiPropertyOptional({ description: 'Status da unidade', enum: UnitStatus })
  @IsEnum(UnitStatus)
  @IsOptional()
  status?: UnitStatus;
}

export class UnitResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  block: string;

  @ApiProperty()
  number: string;

  @ApiProperty()
  identifier: string;

  @ApiProperty({ enum: UnitStatus })
  status: UnitStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

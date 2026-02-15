import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';

export class CreateCommonAreaDto {
  @ApiProperty({ description: 'Nome da area comum' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descricao' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Regras de uso' })
  @IsString()
  @IsOptional()
  rules?: string;

  @ApiPropertyOptional({ description: 'Capacidade maxima' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxCapacity?: number;
}

export class UpdateCommonAreaDto {
  @ApiPropertyOptional({ description: 'Nome da area comum' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Descricao' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Regras de uso' })
  @IsString()
  @IsOptional()
  rules?: string;

  @ApiPropertyOptional({ description: 'Capacidade maxima' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxCapacity?: number;

  @ApiPropertyOptional({ description: 'Area ativa' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class CommonAreaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: String, nullable: true })
  rules: string | null;

  @ApiProperty({ type: Number, nullable: true })
  maxCapacity: number | null;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

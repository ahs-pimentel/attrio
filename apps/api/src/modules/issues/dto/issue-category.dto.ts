import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateIssueCategoryDto {
  @ApiProperty({ description: 'Nome da categoria' })
  @IsString()
  @MaxLength(100)
  name: string;
}

export class UpdateIssueCategoryDto {
  @ApiPropertyOptional({ description: 'Nome da categoria' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Categoria ativa' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class IssueCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;
}

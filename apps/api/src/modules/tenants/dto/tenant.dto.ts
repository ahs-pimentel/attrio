import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, Matches, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ description: 'Nome do condominio', example: 'Residencial Aurora' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Slug unico para identificacao (somente letras minusculas, numeros e hifens)',
    example: 'residencial-aurora',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug deve conter apenas letras minusculas, numeros e hifens',
  })
  slug: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ description: 'Nome do condominio' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Slug unico' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug deve conter apenas letras minusculas, numeros e hifens',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'Status ativo/inativo' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class TenantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

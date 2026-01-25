import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsUUID, MaxLength } from 'class-validator';
import { InviteStatus } from '@attrio/contracts';

export class CreateInviteDto {
  @ApiProperty({ description: 'ID da unidade' })
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @ApiProperty({ description: 'Nome do morador', example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Email do morador', example: 'joao@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Telefone do morador', example: '11999999999' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;
}

export class InviteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  unitId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  token: string;

  @ApiProperty({ enum: InviteStatus })
  status: InviteStatus;

  @ApiProperty()
  expiresAt: Date;

  @ApiPropertyOptional({ nullable: true })
  acceptedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class ValidateInviteResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiPropertyOptional()
  invite?: {
    name: string;
    email: string;
    phone: string;
    unitIdentifier: string;
    tenantName: string;
  };

  @ApiPropertyOptional()
  error?: string;
}

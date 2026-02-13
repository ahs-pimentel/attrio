import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength, Length } from 'class-validator';
import { ParticipantApprovalStatus } from '@attrio/contracts';

export class CheckinRequestDto {
  @ApiProperty({ description: 'Token de check-in da assembleia (do QR Code)' })
  @IsString()
  @IsNotEmpty()
  checkinToken: string;

  @ApiProperty({ description: 'Codigo OTP de 6 digitos (exibido pelo sindico)' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ description: 'Identificador da unidade (ex: A-101)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unitIdentifier: string;

  @ApiPropertyOptional({ description: 'ID do morador (se for o proprio)' })
  @IsUUID()
  @IsOptional()
  residentId?: string;

  @ApiPropertyOptional({ description: 'Nome do procurador (se nao for morador)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  proxyName?: string;

  @ApiPropertyOptional({ description: 'Documento do procurador' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  proxyDocument?: string;
}

export class CheckinResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  participantId: string;

  @ApiProperty()
  assemblyId: string;

  @ApiProperty()
  assemblyTitle: string;

  @ApiProperty()
  unitIdentifier: string;

  @ApiProperty()
  checkinTime: Date;

  @ApiProperty({ description: 'Token de sessao para area do participante' })
  sessionToken: string;

  @ApiProperty({ description: 'Status de aprovacao (APPROVED, PENDING, REJECTED)', enum: ParticipantApprovalStatus })
  approvalStatus: ParticipantApprovalStatus;

  @ApiProperty({ description: 'Se e procurador' })
  isProxy: boolean;

  @ApiPropertyOptional()
  message?: string;
}

export class CheckoutRequestDto {
  @ApiProperty({ description: 'Token de check-in da assembleia' })
  @IsString()
  @IsNotEmpty()
  checkinToken: string;

  @ApiProperty({ description: 'ID do participante' })
  @IsUUID()
  @IsNotEmpty()
  participantId: string;
}

export class AttendanceStatusDto {
  @ApiProperty()
  assemblyId: string;

  @ApiProperty()
  assemblyTitle: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalUnits: number;

  @ApiProperty()
  registeredParticipants: number;

  @ApiProperty()
  checkedIn: number;

  @ApiProperty()
  checkedOut: number;

  @ApiProperty()
  currentlyPresent: number;

  @ApiProperty()
  quorumPercentage: number;

  @ApiProperty()
  totalVotingWeight: number;

  @ApiProperty()
  presentVotingWeight: number;
}

export class QrCodeDataDto {
  @ApiProperty({ description: 'Token para gerar QR Code' })
  checkinToken: string;

  @ApiProperty({ description: 'URL base para check-in' })
  checkinUrl: string;

  @ApiProperty({ description: 'ID da assembleia' })
  assemblyId: string;

  @ApiProperty({ description: 'Titulo da assembleia' })
  assemblyTitle: string;
}

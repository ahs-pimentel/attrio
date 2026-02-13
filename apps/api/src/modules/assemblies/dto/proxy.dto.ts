import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ParticipantApprovalStatus } from '@attrio/contracts';

export class RejectProxyDto {
  @ApiProperty({ description: 'Motivo da rejeicao' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class ProxyUploadResponseDto {
  @ApiProperty()
  participantId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  uploadedAt: Date;
}

export class PendingProxyDto {
  @ApiProperty()
  participantId: string;

  @ApiProperty()
  unitIdentifier: string;

  @ApiProperty()
  proxyName: string;

  @ApiPropertyOptional()
  proxyDocument: string | null;

  @ApiPropertyOptional()
  fileName: string | null;

  @ApiPropertyOptional()
  fileUrl: string | null;

  @ApiProperty()
  checkinTime: Date;
}

export class ProxyApprovalResultDto {
  @ApiProperty()
  participantId: string;

  @ApiProperty()
  unitIdentifier: string;

  @ApiProperty({ enum: ParticipantApprovalStatus })
  approvalStatus: ParticipantApprovalStatus;

  @ApiPropertyOptional()
  approvedAt?: Date;

  @ApiPropertyOptional()
  rejectionReason?: string;
}

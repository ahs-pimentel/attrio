import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ReservationStatus } from '@attrio/contracts';

export class CreateReservationDto {
  @ApiProperty({ description: 'ID da area comum' })
  @IsUUID()
  commonAreaId: string;

  @ApiProperty({ description: 'Data da reserva (YYYY-MM-DD)' })
  @IsDateString()
  reservationDate: string;

  @ApiPropertyOptional({ description: 'Observacoes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateReservationStatusDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'CANCELLED'] })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @ApiPropertyOptional({ description: 'Motivo da rejeicao' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class ReservationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  commonAreaId: string;

  @ApiProperty()
  commonAreaName: string;

  @ApiProperty()
  reservedBy: string;

  @ApiProperty()
  reservedByName: string;

  @ApiProperty()
  reservationDate: string;

  @ApiProperty({ enum: ReservationStatus })
  status: ReservationStatus;

  @ApiProperty({ type: String, nullable: true })
  notes: string | null;

  @ApiProperty({ type: String, nullable: true })
  approvedBy: string | null;

  @ApiProperty({ type: String, nullable: true })
  approvedByName: string | null;

  @ApiProperty({ type: Date, nullable: true })
  approvedAt: Date | null;

  @ApiProperty({ type: String, nullable: true })
  rejectionReason: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
